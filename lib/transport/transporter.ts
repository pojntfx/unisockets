import { v4 } from "uuid";
import { getLogger } from "../utils/logger";
import { ExtendedRTCConfiguration, RTCPeerConnection } from "wrtc";
import { SDPInvalidError } from "../signaling/errors/sdp-invalid";

export class Transporter {
  private logger = getLogger();

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

    await handleCandidate(v4());
    await handleCandidate(v4());
    await handleCandidate(v4());

    return v4();
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
