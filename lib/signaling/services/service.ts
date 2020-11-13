import WebSocket, { Data } from "ws";
import { getLogger } from "../../utils/logger";
import { UnimplementedOperationError } from "../errors/unimplemented-operation";
import {
  Acknowledgement,
  IAcknowledgementData,
} from "../operations/acknowledgement";
import { Gone, IGoneData } from "../operations/gone";
import { IOfferData, Offer } from "../operations/offer";
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

    this.logger.debug("Received Operation", operation);

    switch (operation.opcode) {
      case ESIGNALING_OPCODES.ACKNOWLEDGED: {
        this.logger.info("Acknowledged", operation.data);

        return new Acknowledgement(operation.data as IAcknowledgementData);
      }

      case ESIGNALING_OPCODES.OFFER: {
        this.logger.info("Offer", operation.data);

        return new Offer(operation.data as IOfferData);
      }

      case ESIGNALING_OPCODES.GONE: {
        this.logger.info("Gone", operation.data);

        return new Gone(operation.data as IGoneData);
      }

      // TODO: Handle answers

      default: {
        throw new UnimplementedOperationError(operation.opcode);
      }
    }
  }
}
