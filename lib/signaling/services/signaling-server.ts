import { v4 } from "uuid";
import WebSocket, { Server } from "ws";
import { Acknowledgement } from "../operations/acknowledgement";
import { Gone } from "../operations/gone";
import { ISignalingOperation, TSignalingData } from "../operations/operation";
import { Service } from "./service";

export class SignalingServer extends Service {
  private clients = new Map<string, WebSocket>();

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

    this.logger.info("Connected", { id });

    return id;
  }

  private async registerGoodbye(id: string) {
    this.clients.get(id)?.on("close", () => {
      this.clients.delete(id);

      this.clients.forEach(
        async (client) => await this.send(client, new Gone({ id }))
      );

      this.logger.info("Disconnected", { id });
    });
  }

  private async handleOperation(
    operation: ISignalingOperation<TSignalingData>
  ) {
    this.logger.debug("Handling Operation", operation);
  }
}
