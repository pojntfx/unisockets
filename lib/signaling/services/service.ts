import WebSocket, { Data } from "ws";
import { getLogger } from "../../utils/logger";
import { Acknowledgement } from "../operations/acknowledgement";
import { Gone } from "../operations/gone";
import {
  ESIGNALING_OPCODES,
  ISignalingOperation,
  TSignalingData,
} from "../operations/operation";

export class Service {
  protected logger = getLogger();

  protected async send(client: WebSocket, operation: ISignalingOperation<any>) {
    client.send(JSON.stringify(operation));
  }

  protected async receive(
    rawOperation: Data
  ): Promise<ISignalingOperation<TSignalingData>> {
    const operation = JSON.parse(rawOperation as string) as ISignalingOperation<
      TSignalingData
    >;

    this.logger.debug("Operation", operation);

    switch (operation.opcode) {
      case ESIGNALING_OPCODES.ACKNOWLEDGED: {
        this.logger.info("Acknowledged", operation.data);

        return new Acknowledgement(operation.data);
      }

      default: {
        this.logger.info("Gone", operation.data);

        return new Gone(operation.data);
      }
    }
  }
}
