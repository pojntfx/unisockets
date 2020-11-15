import WebSocket from "ws";
import { UnimplementedOperationError } from "../errors/unimplemented-operation";
import { IAcknowledgementData } from "../operations/acknowledgement";
import { Answer, IAnswerData } from "../operations/answer";
import { Candidate, ICandidateData } from "../operations/candidate";
import { IGoodbyeData } from "../operations/goodbye";
import { IOfferData, Offer } from "../operations/offer";
import {
  ESIGNALING_OPCODES,
  ISignalingOperation,
  TSignalingData,
} from "../operations/operation";
import { Service } from "./service";

export class SignalingClient extends Service {
  private id = "";
  private client?: WebSocket;

  constructor(
    private address: string,
    private reconnectDuration: number,
    private getOffer: () => Promise<string>,
    private getAnswer: (offer: string) => Promise<string>,
    private onAnswer: (
      offererId: string,
      answererId: string,
      answer: string,
      handleCandidate: (candidate: string) => Promise<void>
    ) => Promise<void>,
    private onCandidate: (
      offererId: string,
      answererId: string,
      candidate: string
    ) => Promise<void>,
    private onGoodbye: (id: string) => Promise<void>
  ) {
    super();
  }

  async open() {
    this.client = new WebSocket(this.address);
    this.client.onmessage = async (operation) =>
      await this.handleOperation(await this.receive(operation.data));
    this.client.onerror = async (e) => {
      this.logger.error("WebSocket error", e);

      this.client?.terminate();
    };
    this.client.onclose = async () => await this.handleDisconnect();

    this.logger.info("Server connected", { address: this.address });
  }

  private async handleDisconnect() {
    this.logger.info("Server disconnected", {
      address: this.address,
      reconnectingIn: this.reconnectDuration,
    });

    await new Promise((res) => setTimeout(res, this.reconnectDuration));

    await this.open();
  }

  private async sendCandidate(candidate: Candidate) {
    await this.send(this.client, candidate);

    this.logger.info("Sent candidate", candidate);
  }

  private async handleOperation(
    operation: ISignalingOperation<TSignalingData>
  ) {
    this.logger.debug("Handling operation", operation);

    switch (operation.opcode) {
      case ESIGNALING_OPCODES.GOODBYE: {
        const data = operation.data as IGoodbyeData;

        this.logger.info("Received goodbye", data);

        await this.onGoodbye(data.id);
      }

      case ESIGNALING_OPCODES.ACKNOWLEDGED: {
        this.id = (operation.data as IAcknowledgementData).id;

        this.logger.info("Received acknowledgement", { id: this.id });

        const offer = await this.getOffer();

        await this.send(
          this.client,
          new Offer({
            id: this.id,
            offer,
          })
        );

        this.logger.info("Sent offer", { id: this.id, offer });

        break;
      }

      case ESIGNALING_OPCODES.OFFER: {
        const data = operation.data as IOfferData;

        this.logger.info("Received offer", data);

        const answer = await this.getAnswer(data.offer);

        await this.send(
          this.client,
          new Answer({
            offererId: data.id,
            answererId: this.id,
            answer,
          })
        );

        this.logger.info("Sent answer", {
          offererId: data.id,
          answererId: this.id,
          answer,
        });

        break;
      }

      case ESIGNALING_OPCODES.ANSWER: {
        const data = operation.data as IAnswerData;

        this.logger.info("Received answer", data);

        await this.onAnswer(
          data.offererId,
          data.answererId,
          data.answer,
          async (candidate: string) => {
            await this.sendCandidate(
              new Candidate({
                offererId: data.offererId,
                answererId: data.answererId,
                candidate,
              })
            );

            this.logger.info("Sent candidate", data);
          }
        );

        break;
      }

      case ESIGNALING_OPCODES.CANDIDATE: {
        const data = operation.data as ICandidateData;

        this.logger.info("Received candidate", data);

        await this.onCandidate(data.offererId, data.answererId, data.candidate);

        break;
      }

      default: {
        throw new UnimplementedOperationError(operation.opcode);
      }
    }
  }
}
