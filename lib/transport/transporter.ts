import { v4 } from "uuid";
import { getLogger } from "../utils/logger";

export class Transporter {
  private logger = getLogger();

  async getOffer() {
    const offer = v4();

    this.logger.info("Created offer", { offer });

    return offer;
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
