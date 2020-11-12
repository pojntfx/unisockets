import { v4 } from "uuid";
import { createLogger } from "winston";
import { Console } from "winston/lib/winston/transports";
import WebSocket, { Server } from "ws";
import {
  Acknowledgement,
  Gone,
  ISignalingOperation,
} from "./signaling-operations";

export class SignalingServer {
  private logger = createLogger({ transports: new Console() });

  private clients = new Map<string, WebSocket>();

  constructor(private host: string, private port: number) {}

  async open() {
    const server = new Server({
      host: this.host,
      port: this.port,
    });

    server.on("connection", async (client) => {
      const id = await this.acknowledge(client);

      await this.registerGoodbye(id);
    });

    this.logger.info("Listening", { host: this.host, port: this.port });
  }

  private async send(client: WebSocket, operation: ISignalingOperation) {
    client.send(JSON.stringify(operation));
  }

  private async acknowledge(client: WebSocket) {
    const id = v4();

    await this.send(client, new Acknowledgement({ id }));

    this.clients.set(id, client);

    this.logger.info("Client connected", { id });

    return id;
  }

  private async registerGoodbye(id: string) {
    this.clients.get(id)?.on("close", () => {
      this.clients.delete(id);

      this.clients.forEach(
        async (client) => await this.send(client, new Gone({ id }))
      );

      this.logger.info("Client disconnected", { id });
    });
  }
}
