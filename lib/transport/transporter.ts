import { v4 } from "uuid";
import { getLogger } from "../utils/logger";
import {
  ExtendedRTCConfiguration,
  RTCPeerConnection,
  RTCSessionDescription,
} from "wrtc";
import { SDPInvalidError } from "../signaling/errors/sdp-invalid";

export class Transporter {
  private logger = getLogger();
  private connections = new Map<string, RTCPeerConnection>();

  constructor(private config: ExtendedRTCConfiguration) {}

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

    await handleCandidate(v4());
    await handleCandidate(v4());
    await handleCandidate(v4());

    return v4();
  }

  async handleCandidate(id: string, candidate: string) {
    this.logger.info("Handling candidate", { id, candidate });
  }
}
