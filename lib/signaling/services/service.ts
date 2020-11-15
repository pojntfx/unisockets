import WebSocket, { Data } from "ws";
import { getLogger } from "../../utils/logger";
import { ClientClosedError } from "../errors/client-closed";
import { UnimplementedOperationError } from "../errors/unimplemented-operation";
import {
  Acknowledgement,
  IAcknowledgementData,
} from "../operations/acknowledgement";
import { Alias, IAliasData } from "../operations/alias";
import { Answer, IAnswerData } from "../operations/answer";
import { Bind, IBindData } from "../operations/bind";
import { Candidate, ICandidateData } from "../operations/candidate";
import { Connect, IConnectData } from "../operations/connect";
import { Goodbye, IGoodbyeData } from "../operations/goodbye";
import { IOfferData, Offer } from "../operations/offer";
import {
  ESIGNALING_OPCODES,
  ISignalingOperation,
  TSignalingData,
} from "../operations/operation";
import { IShutdownData, Shutdown } from "../operations/shutdown";

export class Service {
  protected logger = getLogger();

  protected async send(
    client: WebSocket | undefined,
    operation: ISignalingOperation<any>
  ) {
    if (client) {
      client.send(JSON.stringify(operation));
    } else {
      throw new ClientClosedError();
    }
  }

  protected async receive(
    rawOperation: Data
  ): Promise<ISignalingOperation<TSignalingData>> {
    const operation = JSON.parse(rawOperation as string) as ISignalingOperation<
      TSignalingData
    >;

    this.logger.debug("Received operation", operation);

    switch (operation.opcode) {
      case ESIGNALING_OPCODES.GOODBYE: {
        this.logger.info("Received operation goodbye", operation.data);

        return new Goodbye(operation.data as IGoodbyeData);
      }

      case ESIGNALING_OPCODES.ACKNOWLEDGED: {
        this.logger.info("Received operation acknowledged", operation.data);

        return new Acknowledgement(operation.data as IAcknowledgementData);
      }

      case ESIGNALING_OPCODES.OFFER: {
        this.logger.info("Received operation offer", operation.data);

        return new Offer(operation.data as IOfferData);
      }

      case ESIGNALING_OPCODES.ANSWER: {
        this.logger.info("Received operation answer", operation.data);

        return new Answer(operation.data as IAnswerData);
      }

      case ESIGNALING_OPCODES.CANDIDATE: {
        this.logger.info("Received operation candidate", operation.data);

        return new Candidate(operation.data as ICandidateData);
      }

      case ESIGNALING_OPCODES.BIND: {
        this.logger.info("Received operation bind", operation.data);

        return new Bind(operation.data as IBindData);
      }

      case ESIGNALING_OPCODES.ALIAS: {
        this.logger.info("Received operation alias", operation.data);

        return new Alias(operation.data as IAliasData);
      }

      case ESIGNALING_OPCODES.SHUTDOWN: {
        this.logger.info("Received operation shutdown", operation.data);

        return new Shutdown(operation.data as IShutdownData);
      }

      case ESIGNALING_OPCODES.CONNECT: {
        this.logger.info("Received operation connect", operation.data);

        return new Connect(operation.data as IConnectData);
      }

      default: {
        throw new UnimplementedOperationError(operation.opcode);
      }
    }
  }
}
