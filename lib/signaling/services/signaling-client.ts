import WebSocket from "ws";
import { ISignalingOperation, TSignalingData } from "../operations/operation";
import { Service } from "./service";

export class SignalingClient extends Service {
  constructor(private address: string) {
    super();
  }

  async open() {
    const client = new WebSocket(this.address);

    client.on(
      "message",
      async (operation) =>
        await this.handleOperation(await this.receive(operation))
    );

    this.logger.info("Connected", { address: this.address });
  }

  private async handleOperation(
    operation: ISignalingOperation<TSignalingData>
  ) {
    this.logger.debug("Handling Operation", operation);
  }
}
