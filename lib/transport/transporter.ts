import { v4 } from "uuid";

export class Transporter {
  async open() {
    return v4();
  }

  async handleOffer(
    id: string,
    offer: string,
    handleCandidate: (candidate: string) => Promise<void>
  ) {
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
    await handleCandidate(v4());
    await handleCandidate(v4());
    await handleCandidate(v4());

    return v4();
  }

  async handleCandidate(id: string, candidate: string) {}
}
