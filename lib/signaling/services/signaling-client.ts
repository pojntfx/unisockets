import WebSocket from "ws";
import { ClientClosedError } from "../errors/client-closed";
import { UnimplementedOperationError } from "../errors/unimplemented-operation";
import { IAcknowledgementData } from "../operations/acknowledgement";
import { Offer } from "../operations/offer";
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
    private getOffer: () => Promise<string>
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
      case ESIGNALING_OPCODES.ACKNOWLEDGED: {
        this.id = (operation.data as IAcknowledgementData).id;

        this.logger.info("Acknowledged", { id: this.id });

        const offer = await this.getOffer();

        if (this.client) {
          await this.send(
            this.client,
            new Offer({
              id: this.id,
              offer,
            })
          );
        } else {
          throw new ClientClosedError();
        }

        this.logger.info("Offer", { id: this.id, offer });

        break;
      }

      // TODO: Handle answers

      default: {
        throw new UnimplementedOperationError(operation.opcode);
      }
    }
  }
}
