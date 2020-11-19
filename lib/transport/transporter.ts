import {
  ExtendedRTCConfiguration,


  RTCIceCandidate, RTCPeerConnection,
  RTCSessionDescription
} from "wrtc";
import { ConnectionDoesNotExistError } from "../signaling/errors/connection-does-not-exist";
import { SDPInvalidError } from "../signaling/errors/sdp-invalid";
import { getLogger } from "../utils/logger";

export class Transporter {
  private logger = getLogger();
  private connections = new Map<string, RTCPeerConnection>();
  private channels = new Map<string, RTCDataChannel>();

  constructor(
    private config: ExtendedRTCConfiguration,
    private onConnect: (id: string) => Promise<void>,
    private onDisconnect: (id: string) => Promise<void>
  ) {}

  async getOffer() {
    const offerConnection = new RTCPeerConnection(this.config);

    offerConnection.createDataChannel("channel");

    const offer = await offerConnection.createOffer();

    this.logger.info("Created offer", { offer: offer.sdp });

    offerConnection.close();

    if (offer.sdp === undefined) {
      throw new SDPInvalidError();
    }

    return offer.sdp;
  }

  async handleOffer(
    id: string,
    offer: string,
    handleCandidate: (candidate: string) => Promise<void>
  ) {
    this.logger.info("Handling offer", { id, offer });

    const connection = new RTCPeerConnection(this.config);

    connection.onconnectionstatechange = async (e: any) =>
      await this.handleConnectionStatusChange(e.connectionState as string, id);

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

    this.logger.info("Created answer", { offer: offer, answer: answer.sdp });

    await connection.setLocalDescription(answer);

    // TODO: Remove this experimental block
    connection.ondatachannel = async ({ channel }) => {
      console.log("connection ondatachannel");

      channel.onopen = async () => {
        console.log("channel onopen");
      };
      channel.onmessage = async (msg) => {
        console.log("channel onmessage", msg);
      };
      channel.onclose = async () => {
        console.log("channel onclose");
      };
    };

    this.connections.set(id, connection);

    this.logger.debug("Created connection", {
      newConnections: JSON.stringify(Array.from(this.connections.keys())),
    });

    if (answer.sdp === undefined) {
      throw new SDPInvalidError();
    }

    return answer.sdp;
  }

  async handleAnswer(
    id: string,
    answer: string,
    handleCandidate: (candidate: string) => Promise<void>
  ) {
    this.logger.info("Handling answer", { id, answer });

    const connection = new RTCPeerConnection(this.config);

    connection.onconnectionstatechange = async (e: any) =>
      await this.handleConnectionStatusChange(e.connectionState as string, id);

    connection.onicecandidate = async (e) => {
      e.candidate && handleCandidate(JSON.stringify(e.candidate));
    };

    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);

    await connection.setRemoteDescription(
      new RTCSessionDescription({
        type: "answer",
        sdp: answer,
      })
    );

    // TODO: Remove this experimental block
    const channel = connection.createDataChannel("channel");
    channel.onopen = async () => {
      console.log("channel onopen");
    };
    channel.onmessage = async (msg) => {
      console.log("channel onmessage", msg);
    };
    channel.onclose = async () => {
      console.log("channel onclose");
    };

    // TODO: Remove this experimental block
    setInterval(async () => {
      console.log("Sending ...");

      channel.send("Hey!");
    }, 1000);

    this.connections.set(id, connection);

    this.logger.debug("Created connection", {
      newConnections: JSON.stringify(Array.from(this.connections.keys())),
    });
  }

  async handleCandidate(id: string, candidate: string) {
    this.logger.info("Handling candidate", { id, candidate });

    if (this.connections.has(id)) {
      const connection = this.connections.get(id);

      await connection?.addIceCandidate(
        new RTCIceCandidate(JSON.parse(candidate))
      );
    } else {
      throw new ConnectionDoesNotExistError();
    }
  }

  async shutdown(id: string) {
    if (this.connections.has(id)) {
      this.logger.info("Shutting down connection", { id });

      this.connections.get(id)?.close();

      this.connections.delete(id);

      this.logger.debug("Deleted connection", {
        newConnections: JSON.stringify(Array.from(this.connections.keys())),
      });
    }

    if (this.channels.has(id)) {
      this.logger.info("Shutting down channel", { id });

      this.channels.get(id)?.close();

      this.channels.delete(id);

      this.logger.debug("Deleted channel", {
        newConnections: JSON.stringify(Array.from(this.connections.keys())),
      });
    }
  }

  private async handleConnectionStatusChange(
    connectionState: string,
    id: string
  ) {
    switch (connectionState) {
      case "connected": {
        await this.onConnect(id);

        break;
      }

      default: {
        await this.onDisconnect(id);

        break;
      }
    }
  }
}
