import * as Asyncify from "asyncify-wasm";
import { EventEmitter } from "events";
import fs from "fs";
import { WASI } from "wasi";
import { ExtendedRTCConfiguration } from "wrtc";
import yargs from "yargs";
import { AliasDoesNotExistError } from "../lib/signaling/errors/alias-does-not-exist";
import { SignalingClient } from "../lib/signaling/services/signaling-client";
import { Sockets } from "../lib/sockets/sockets";
import { Transporter } from "../lib/transport/transporter";
import { getLogger } from "../lib/utils/logger";
const Go = require("../vendor/tinygo/wasm_exec");

const TEST_SUBNET = "10.0.0";

const transporterConfig: ExtendedRTCConfiguration = {
  iceServers: [
    {
      urls: "stun:global.stun.twilio.com:3478?transport=udp",
    },
  ],
};

const { raddr, reconnectDuration, testBind, testTinyGo, testAsync } = yargs(
  process.argv.slice(2)
).options({
  raddr: {
    description: "Remote address",
    default: "ws://localhost:6999",
  },
  reconnectDuration: {
    description: "Reconnect duration in milliseconds",
    default: 1000,
  },
  testBind: {
    description: "Run the server implementation",
    default: false,
  },
  testTinyGo: {
    description:
      "Use the TinyGo example server/client implementations instead of the C implementations",
    default: false,
  },
  testAsync: {
    description: "Use the async import API",
    default: false,
  },
}).argv;

const logger = getLogger();

const handleTransporterConnectionConnect = async (id: string) => {
  logger.info("Handling transporter connection connect", { id });
};
const handleTransporterConnectionDisconnect = async (id: string) => {
  logger.info("Handling transporter connection disconnect", { id });
};
const handleTransporterChannelOpen = async (id: string) => {
  logger.info("Handling transporter connection open", { id });
};
const handleTransporterChannelClose = async (id: string) => {
  logger.info("Handling transporter connection close", { id });
};

const ready = new EventEmitter();

const aliases = new Map<string, string>();
const transporter = new Transporter(
  transporterConfig,
  handleTransporterConnectionConnect,
  handleTransporterConnectionDisconnect,
  handleTransporterChannelOpen,
  handleTransporterChannelClose
);

const handleConnect = async () => {
  logger.info("Handling connect");
};
const handleDisconnect = async () => {
  logger.info("Handling disconnect");
};
const handleAcknowledgement = async (id: string, rejected: boolean) => {
  logger.debug("Handling acknowledgement", { id, rejected });

  if (rejected) {
    logger.error("Knock rejected", {
      id,
    });
  }

  ready.emit("ready", true);
};
const getOffer = async (
  answererId: string,
  handleCandidate: (candidate: string) => Promise<any>
) => {
  const offer = await transporter.getOffer(answererId, handleCandidate);

  logger.info("Created offer", { answererId, offer });

  return offer;
};
const handleOffer = async (
  offererId: string,
  offer: string,
  handleCandidate: (candidate: string) => Promise<any>
) => {
  const answer = await transporter.handleOffer(
    offererId,
    offer,
    handleCandidate
  );

  logger.info("Created answer for offer", { offererId, offer, answer });

  return answer;
};
const handleAnswer = async (
  offererId: string,
  answererId: string,
  answer: string
) => {
  logger.info("Handling answer", { offererId, answererId, answer });

  await transporter.handleAnswer(answererId, answer);
};
const handleCandidate = async (
  offererId: string,
  answererId: string,
  candidate: string
) => {
  logger.info("Handling candidate", { offererId, answererId, candidate });

  await transporter.handleCandidate(offererId, candidate);
};
const handleGoodbye = async (id: string) => {
  logger.info("Handling goodbye", { id });

  await transporter.shutdown(id);
};
const handleAlias = async (id: string, alias: string, set: boolean) => {
  logger.debug("Handling alias", { id });

  if (set) {
    logger.info("Setting alias", { id, alias });

    aliases.set(alias, id);

    logger.debug("New aliases", {
      aliases: JSON.stringify(Array.from(aliases)),
    });
  } else {
    logger.info("Removing alias", { id, alias });

    aliases.delete(alias);

    logger.debug("New aliases", {
      aliases: JSON.stringify(Array.from(aliases)),
    });
  }
};

const signalingClient = new SignalingClient(
  raddr,
  reconnectDuration,
  TEST_SUBNET,
  handleConnect,
  handleDisconnect,
  handleAcknowledgement,
  getOffer,
  handleOffer,
  handleAnswer,
  handleCandidate,
  handleGoodbye,
  handleAlias
);

const handleExternalBind = async (alias: string) => {
  logger.info("Handling external bind", { alias });

  await signalingClient.bind(alias);
};

const handleExternalAccept = async (alias: string) => {
  logger.info("Handling external accept", { alias });

  return await signalingClient.accept(alias);
};

const handleExternalConnect = async (alias: string) => {
  logger.info("Handling external connect", { alias });

  await signalingClient.connect(alias);
};

const handleExternalSend = async (alias: string, msg: Uint8Array) => {
  logger.info("Handling external send", { alias, msg });

  if (aliases.has(alias)) {
    return await transporter.send(aliases.get(alias)!, msg); // .has
  } else {
    logger.error("Could not find alias", { alias });
  }
};

const handleExternalRecv = async (alias: string) => {
  if (aliases.has(alias)) {
    const msg = await transporter.recv(aliases.get(alias)!); // .has

    logger.info("Handling external recv", { alias, msg });

    return msg;
  } else {
    throw new AliasDoesNotExistError();
  }
};

const sockets = new Sockets(
  handleExternalBind,
  handleExternalAccept,
  handleExternalConnect,
  handleExternalSend,
  handleExternalRecv
);

const wasi = new WASI();

let acceptCount = 0;

if (testAsync) {
  (async () => {
    const go = new Go();
    const { env: tinyGoEnvImports, ...tinyGoImports } = go.importObject;

    const instance = await WebAssembly.instantiate(
      await WebAssembly.compile(
        fs.readFileSync("./examples/tinygo/async_echo_server.wasm")
      ),
      {
        wasi_unstable: wasi.wasiImport,
        ...tinyGoImports,
        env: {
          ...tinyGoEnvImports,
          "command-line-arguments.triggerAccept": () => {
            (async () => {
              await new Promise((res) => setTimeout(res, 1000));

              acceptCount++;

              (instance.exports as any).resolveAccept(acceptCount);
            })();
          },
        },
      }
    );

    go.run(instance);
  })();
} else {
  ready.once("ready", async () => {
    const { memoryId, imports: socketEnvImports } = await sockets.getImports();

    if (testTinyGo) {
      const go = new Go();
      const { env: tinyGoEnvImports, ...tinyGoImports } = go.importObject;

      const instance = await Asyncify.instantiate(
        await WebAssembly.compile(
          testBind
            ? fs.readFileSync("./examples/tinygo/echo_server.wasm") // TODO: Replace with TinyGo implementation once ready
            : fs.readFileSync("./examples/tinygo/echo_client.wasm")
        ),
        {
          wasi_snapshot_preview1: wasi.wasiImport,
          ...tinyGoImports,
          env: {
            ...tinyGoEnvImports,
            ...socketEnvImports,
            berkeley_sockets_accept: async (
              fd: number,
              addressPointer: number,
              addressLengthPointer: number
            ) => {
              instance.exports.go_scheduler();

              return await socketEnvImports.berkeley_sockets_accept(
                fd,
                addressPointer,
                addressLengthPointer
              );
            },
            berkeley_sockets_recv: async (
              fd: number,
              messagePointer: number,
              messagePointerLength: number
            ) => {
              instance.exports.go_scheduler();

              return await socketEnvImports.berkeley_sockets_recv(
                fd,
                messagePointer,
                messagePointerLength
              );
            },
          },
        }
      );

      sockets.setMemory(memoryId, instance.exports.memory);

      go.run(instance);
    } else {
      const instance = await Asyncify.instantiate(
        await WebAssembly.compile(
          testBind
            ? fs.readFileSync("./examples/c/echo_server.wasm")
            : fs.readFileSync("./examples/c/echo_client.wasm")
        ),
        {
          wasi_snapshot_preview1: wasi.wasiImport,
          env: socketEnvImports,
        }
      );

      sockets.setMemory(memoryId, instance.exports.memory);

      wasi.start(instance);
    }
  });

  signalingClient.open();
}
