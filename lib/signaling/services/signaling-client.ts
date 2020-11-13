import WebSocket from "ws";
import { UnimplementedOperationError } from "../errors/unimplemented-operation";
import { IAcknowledgementData } from "../operations/acknowledgement";
import { Answer } from "../operations/answer";
import { IGoneData } from "../operations/gone";
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
    private getAnswer: (offer: string) => Promise<string>
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

    this.logger.info("Connected", { address: this.address });
  }

  private async handleDisconnect() {
    this.logger.info("Disconnected", {
      address: this.address,
      reconnectingIn: this.reconnectDuration,
    });

    await new Promise((res) => setTimeout(res, this.reconnectDuration));

    await this.open();
  }

  private async handleOperation(
    operation: ISignalingOperation<TSignalingData>
  ) {
    this.logger.debug("Handling Operation", operation);

    switch (operation.opcode) {
      case ESIGNALING_OPCODES.GONE: {
        const data = operation.data as IGoneData;

        this.logger.info("Gone", data);
      }

      case ESIGNALING_OPCODES.ACKNOWLEDGED: {
        this.id = (operation.data as IAcknowledgementData).id;

        this.logger.info("Acknowledged", { id: this.id });

        const offer = await this.getOffer();

        await this.send(
          this.client,
          new Offer({
            id: this.id,
            offer,
          })
        );

        this.logger.info("Offer", { id: this.id, offer });

        break;
      }

      case ESIGNALING_OPCODES.OFFER: {
        const data = operation.data as IOfferData;

        this.logger.info("Answering", data);

        const answer = await this.getAnswer(data.offer);

        await this.send(
          this.client,
          new Answer({
            offererId: data.id,
            answererId: this.id,
            answer,
          })
        );

        this.logger.info("Answer", {
          offererId: data.id,
          answererId: this.id,
          answer,
        });

        break;
      }

      // TODO: Handle answers

      default: {
        throw new UnimplementedOperationError(operation.opcode);
      }
    }
  }
}
