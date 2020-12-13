import {
  ExtendedRTCConfiguration,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "wrtc";
import { ChannelDoesNotExistError } from "../signaling/errors/channel-does-not-exist";
import { ConnectionDoesNotExistError } from "../signaling/errors/connection-does-not-exist";
import { SDPInvalidError } from "../signaling/errors/sdp-invalid";
import { getLogger } from "../utils/logger";
import Emittery from "emittery";

export class Transporter {
  private logger = getLogger();
  private connections = new Map<string, RTCPeerConnection>();
  private channels = new Map<string, RTCDataChannel>();
  private queuedMessages = new Map<string, Uint8Array[]>();
  private queuedCandidates = new Map<string, string[]>();
  private asyncResolver = new Emittery();

  constructor(
    private config: ExtendedRTCConfiguration,
    private onConnectionConnect: (id: string) => Promise<void>,
    private onConnectionDisconnect: (id: string) => Promise<void>,
    private onChannelOpen: (id: string) => Promise<void>,
    private onChannelClose: (id: string) => Promise<void>
  ) {}

  async close() {
    this.logger.debug("Closing transporter");

    for (let connection of this.connections) {
      await this.shutdown(connection[0]);
    }
  }

  async getOffer(
    answererId: string,
    handleCandidate: (candidate: string) => Promise<void>
  ) {
    this.logger.debug("Getting offer", { answererId });

    const connection = new RTCPeerConnection(this.config);
    this.connections.set(answererId, connection);

    connection.onconnectionstatechange = async () =>
      await this.handleConnectionStatusChange(
        connection.connectionState,
        answererId
      );

    connection.onicecandidate = async (e) => {
      e.candidate && handleCandidate(JSON.stringify(e.candidate));
    };

    const channel = connection.createDataChannel("channel");
    this.channels.set(answererId, channel);

    channel.onopen = async () => {
      this.logger.debug("Channel opened", { id: answererId });

      await this.asyncResolver.emit(this.getChannelKey(answererId), true);

      await this.onChannelOpen(answererId);
    };
    channel.onmessage = async (msg) => {
      await this.queueAndEmitMessage(answererId, msg.data);
    };
    channel.onclose = async () => {
      this.logger.debug("Channel close", { id: answererId });

      await this.onChannelClose(answererId);
    };

    this.queuedMessages.set(answererId, []);

    this.logger.verbose("Created channel", {
      newChannels: JSON.stringify(Array.from(this.channels.keys())),
    });

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);

    this.logger.debug("Created offer", { offer: offer.sdp });

    if (offer.sdp === undefined) {
      connection.close();

      throw new SDPInvalidError();
    }

    this.logger.debug("Created connection", {
      newConnections: JSON.stringify(Array.from(this.connections.keys())),
    });

    return offer.sdp;
  }

  async handleOffer(
    id: string,
    offer: string,
    handleCandidate: (candidate: string) => Promise<void>
  ) {
    this.logger.debug("Handling offer", { id, offer });

    const connection = new RTCPeerConnection(this.config);
    this.connections.set(id, connection);

    connection.onconnectionstatechange = async () =>
      await this.handleConnectionStatusChange(connection.connectionState, id);

    connection.onicecandidate = async (e) => {
      e.candidate && handleCandidate(JSON.stringify(e.candidate));
    };

    await connection.setRemoteDescription(
      new RTCSessionDescription({
        type: "offer",
        sdp: offer,
      })
    );

    const answer = await connection.createAnswer();

    this.logger.debug("Created answer", { offer: offer, answer: answer.sdp });

    await connection.setLocalDescription(answer);

    await this.addQueuedCandidates(id);

    connection.ondatachannel = async ({ channel }) => {
      this.channels.set(id, channel);

      channel.onopen = async () => {
        this.logger.debug("Channel opened", { id });

        await this.asyncResolver.emit(this.getChannelKey(id), true);

        await this.onChannelOpen(id);
      };
      channel.onmessage = async (msg) => {
        await this.queueAndEmitMessage(id, msg.data);
      };
      channel.onclose = async () => {
        this.logger.debug("Channel close", { id });

        await this.onChannelClose(id);
      };

      this.queuedMessages.set(id, []);

      this.logger.debug("Created channel", {
        newChannels: JSON.stringify(Array.from(this.channels.keys())),
      });
    };

    this.logger.debug("Created connection", {
      newConnections: JSON.stringify(Array.from(this.connections.keys())),
    });

    if (answer.sdp === undefined) {
      throw new SDPInvalidError();
    }

    return answer.sdp;
  }

  async handleAnswer(id: string, answer: string) {
    this.logger.debug("Handling answer", { id, answer });

    if (this.connections.has(id)) {
      const connection = this.connections.get(id);

      await connection?.setRemoteDescription(
        new RTCSessionDescription({
          type: "answer",
          sdp: answer,
        })
      );

      await this.addQueuedCandidates(id);
    } else {
      throw new ConnectionDoesNotExistError();
    }
  }

  async handleCandidate(id: string, candidate: string) {
    this.logger.debug("Handling candidate", { id, candidate });

    if (
      this.connections.has(id) &&
      this.connections.get(id)!.remoteDescription // We check with `.has` and never push undefined
    ) {
      const connection = this.connections.get(id);

      await connection?.addIceCandidate(
        new RTCIceCandidate(JSON.parse(candidate))
      );

      this.logger.debug("Added candidate", { id, candidate });
    } else {
      this.logger.debug("Queueing candidate", { id, candidate });

      if (!this.queuedCandidates.has(id)) this.queuedCandidates.set(id, []);

      this.queuedCandidates.get(id)?.push(candidate);
    }
  }

  async shutdown(id: string) {
    this.logger.debug("Shutting down", { id });

    if (this.connections.has(id)) {
      this.logger.debug("Shutting down connection", { id });

      this.connections.get(id)?.close();

      this.connections.delete(id);

      this.logger.debug("Deleted connection", {
        newConnections: JSON.stringify(Array.from(this.connections.keys())),
      });
    }

    if (this.channels.has(id)) {
      this.logger.verbose("Shutting down channel", { id });

      this.channels.get(id)?.close();

      this.channels.delete(id);

      this.logger.debug("Deleted channel", {
        newChannels: JSON.stringify(Array.from(this.connections.keys())),
      });
    }

    if (this.queuedCandidates.has(id)) {
      this.logger.debug("Removing queued candidates", { id });

      this.queuedCandidates.delete(id);

      this.logger.debug("Deleted queued candidate", {
        newQueuedCandidates: JSON.stringify(
          Array.from(this.queuedCandidates.keys())
        ),
      });
    }

    if (this.queuedMessages.has(id)) {
      this.logger.debug("Removing queued messages", { id });

      this.queuedMessages.delete(id);

      this.logger.debug("Deleted queued messages", {
        newQueuedMessages: JSON.stringify(
          Array.from(this.queuedMessages.keys())
        ),
      });
    }
  }

  async send(id: string, msg: Uint8Array) {
    this.logger.debug("Handling send", { id, msg });

    let channel = this.channels.get(id);

    while (
      !channel ||
      channel!.readyState !== "open" // Checked by !channel
    ) {
      await this.asyncResolver.once(this.getChannelKey(id));

      channel = this.channels.get(id);
    }

    channel!.send(msg); // We check above
  }

  async recv(id: string) {
    this.logger.debug("Handling receive", { id });

    if (
      this.queuedMessages.has(id) &&
      this.queuedMessages.get(id)?.length !== 0 // Checked by .has
    ) {
      return this.queuedMessages.get(id)?.shift()!; // size !== 0 and undefined is ever pushed
    } else {
      const msg = await this.asyncResolver.once(this.getMessageKey(id));

      this.queuedMessages.get(id)?.shift();

      return msg! as Uint8Array;
    }
  }

  private async handleConnectionStatusChange(
    connectionState: string,
    id: string
  ) {
    this.logger.silly("Handling connection status change", {
      connectionState,
      id,
    });

    if (connectionState === "closed") {
      await this.onConnectionDisconnect(id);

      await this.shutdown(id);
    } else {
      connectionState === "connected" && (await this.onConnectionConnect(id));
    }
  }

  private async queueAndEmitMessage(id: string, rawMsg: ArrayBuffer) {
    this.logger.silly("Queueing message", { id, rawMsg });

    const msg = new Uint8Array(rawMsg);

    if (this.channels.has(id)) {
      const messages = this.queuedMessages.get(id);

      messages?.push(msg);

      await this.asyncResolver.emit(this.getMessageKey(id), msg);
    } else {
      throw new ChannelDoesNotExistError();
    }
  }

  private async addQueuedCandidates(id: string) {
    this.logger.silly("Queueing candidate", { id });

    this.queuedCandidates.get(id)?.forEach(async (candidate) => {
      this.queuedCandidates.set(
        id,
        this.queuedCandidates.get(id)?.filter((c) => c !== candidate)! // This only runs if it is not undefined
      );

      await this.handleCandidate(id, candidate);
    });

    this.logger.silly("Added queued candidate", {
      newQueuedCandidates: JSON.stringify(Array.from(this.queuedCandidates)),
    });
  }

  private getMessageKey(id: string) {
    this.logger.silly("Getting message key", { id });

    return `message id=${id}`;
  }

  private getChannelKey(id: string) {
    this.logger.silly("Getting channel key", { id });

    return `channel id=${id}`;
  }
}
