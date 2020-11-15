import { v4 } from "uuid";
import WebSocket, { Server } from "ws";
import { ClientDoesNotExistError } from "../errors/client-does-not-exist";
import { UnimplementedOperationError } from "../errors/unimplemented-operation";
import { Acknowledgement } from "../operations/acknowledgement";
import { Alias } from "../operations/alias";
import { Answer, IAnswerData } from "../operations/answer";
import { IBindData } from "../operations/bind";
import { Candidate, ICandidateData } from "../operations/candidate";
import { Goodbye } from "../operations/goodbye";
import { IOfferData, Offer } from "../operations/offer";
import {
  ESIGNALING_OPCODES,
  ISignalingOperation,
  TSignalingData,
} from "../operations/operation";
import { IShutdownData } from "../operations/shutdown";
import { Service } from "./service";

export class SignalingServer extends Service {
  private clients = new Map<string, WebSocket>();
  private aliases = new Map<string, string>();

  constructor(private host: string, private port: number) {
    super();
  }

  async open() {
    const server = new Server({
      host: this.host,
      port: this.port,
    });

    server.on("connection", async (client) => {
      const id = await this.acknowledge(client);

      client.on(
        "message",
        async (operation) =>
          await this.handleOperation(await this.receive(operation))
      );

      await this.registerGoodbye(id);
    });

    this.logger.info("Listening", { host: this.host, port: this.port });
  }

  private async acknowledge(client: WebSocket) {
    const id = v4();

    await this.send(client, new Acknowledgement({ id }));

    this.clients.set(id, client);

    this.logger.info("Client connected", { id });

    return id;
  }

  private async registerGoodbye(id: string) {
    const client = this.clients.get(id);

    if (client) {
      client.on("close", () => {
        this.clients.delete(id);

        this.aliases.forEach(async (alias, clientId) => {
          clientId === id &&
            this.clients.forEach(
              async (client) =>
                await this.send(client, new Alias({ id, alias, set: false }))
            );
        });

        this.clients.forEach(
          async (client) => await this.send(client, new Goodbye({ id }))
        );

        this.logger.info("Client disconnected", { id });
      });
    } else {
      throw new ClientDoesNotExistError();
    }
  }

  private async handleOperation(
    operation: ISignalingOperation<TSignalingData>
  ) {
    this.logger.debug("Handling operation", operation);

    switch (operation.opcode) {
      case ESIGNALING_OPCODES.OFFER: {
        const data = operation.data as IOfferData;

        this.logger.info("Received offer", data);

        this.clients.forEach(async (client, id) => {
          if (id !== data.id) {
            await this.send(
              client,
              new Offer({
                id: data.id,
                offer: data.offer,
              })
            );
          }

          this.logger.info("Sent offer", { id, data });
        });

        break;
      }

      case ESIGNALING_OPCODES.ANSWER: {
        const data = operation.data as IAnswerData;

        const client = this.clients.get(data.offererId);

        this.logger.info("Received answer", data);

        await this.send(client, new Answer(data));

        this.logger.info("Sent answer", data);

        break;
      }

      case ESIGNALING_OPCODES.CANDIDATE: {
        const data = operation.data as ICandidateData;

        const client = this.clients.get(data.answererId);

        this.logger.info("Received candidate", data);

        await this.send(client, new Candidate(data));

        this.logger.info("Sent candidate", data);

        break;
      }

      case ESIGNALING_OPCODES.BIND: {
        const data = operation.data as IBindData;

        this.logger.info("Received bind", data);

        if (this.aliases.has(data.alias)) {
          this.logger.info("Rejecting bind, alias already taken", data);

          const client = this.clients.get(data.id);

          await this.send(
            client,
            new Alias({ id: data.id, alias: data.alias, set: false })
          );
        } else {
          this.logger.info("Accepting bind", data);

          this.aliases.set(data.alias, data.id);

          this.clients.forEach(async (client, id) => {
            await this.send(
              client,
              new Alias({ id: data.id, alias: data.alias, set: true })
            );

            this.logger.info("Sent alias", { id, data });
          });
        }

        break;
      }

      case ESIGNALING_OPCODES.SHUTDOWN: {
        const data = operation.data as IShutdownData;

        this.logger.info("Received shutdown", data);

        if (
          this.aliases.has(data.alias) &&
          this.aliases.get(data.alias) === data.id
        ) {
          this.aliases.delete(data.alias);

          this.logger.info("Accepting shutdown", data);

          this.clients.forEach(async (client, id) => {
            await this.send(
              client,
              new Alias({ id: data.id, alias: data.alias, set: false })
            );

            this.logger.info("Sent alias", { id, data });
          });
        } else {
          this.logger.info(
            "Rejecting shutdown, alias not taken or incorrect client ID",
            data
          );

          const client = this.clients.get(data.id);

          await this.send(
            client,
            new Alias({ id: data.id, alias: data.alias, set: true })
          );
        }

        break;
      }

      default: {
        throw new UnimplementedOperationError(operation.opcode);
      }
    }
  }
}
