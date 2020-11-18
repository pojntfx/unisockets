import {
  ExtendedRTCConfiguration,
  RTCPeerConnection,
  RTCSessionDescription,
} from "wrtc";
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
      e.candidate && handleCandidate(JSON.stringify(e));
    };

    connection.setRemoteDescription(
      new RTCSessionDescription({
        type: "offer",
        sdp: offer,
      })
    );

    const answer = await connection.createAnswer();

    this.logger.info("Created answer", { offer: offer, answer: answer.sdp });

    connection.setLocalDescription(answer);

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

    const offer = await this.getOffer();
    connection.setLocalDescription(
      new RTCSessionDescription({
        type: "offer",
        sdp: offer,
      })
    );

    connection.onicecandidate = async (e) => {
      e.candidate && handleCandidate(JSON.stringify(e));
    };

    connection.setRemoteDescription(
      new RTCSessionDescription({
        type: "answer",
        sdp: answer,
      })
    );

    this.connections.set(id, connection);

    this.logger.debug("Created connection", {
      newConnections: JSON.stringify(Array.from(this.connections.keys())),
    });
  }

  async handleCandidate(id: string, candidate: string) {
    this.logger.info("Handling candidate", { id, candidate });
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
