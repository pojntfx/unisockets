import WebSocket, { Server } from "ws";
import yargs from "yargs";
import { v4 } from "uuid";
import { createLogger, transports } from "winston";

const log = createLogger({ transports: new transports.Console() });

enum ESIGNALING_SERVER_OPCODES {
  ACKNOWLEDGED,
}

interface IOperation {
  opcode: ESIGNALING_SERVER_OPCODES;
}

interface IOperationAcknowledgement extends IOperation {
  data: {
    id: string;
  };
}

const { laddr } = yargs(process.argv.slice(2)).options({
  laddr: {
    default: "0.0.0.0:6999",
  },
}).argv;

const server = new Server({
  host: laddr.split(":")[0],
  port: parseInt(laddr.split(":")[1]),
});

const clients = new Map<string, WebSocket>();

server.on("connection", (client) => {
  const id = v4();
  clients.set(id, client);

  const acknowledgement: IOperationAcknowledgement = {
    opcode: ESIGNALING_SERVER_OPCODES.ACKNOWLEDGED,
    data: {
      id,
    },
  };
  client.send(JSON.stringify(acknowledgement));
  log.info("Client connected", { id });

  client.on("message", (message) => {
    client.send(`You've sent: ${message}`);
  });

  client.on("close", () => {
    clients.delete(id);

    log.info("Client disconnected", { id });
  });
});
