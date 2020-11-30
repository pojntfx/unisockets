import * as Asyncify from "asyncify-wasm";
import { EventEmitter } from "events";
import fs from "fs";
import { WASI } from "wasi";
import { ExtendedRTCConfiguration } from "wrtc";
import yargs from "yargs";
import { AliasDoesNotExistError } from "../../pkg/web/signaling/errors/alias-does-not-exist";
import { SignalingClient } from "../../pkg/web/signaling/services/signaling-client";
import { Sockets } from "../../pkg/web/sockets/sockets";
import { Transporter } from "../../pkg/web/transport/transporter";
import { getLogger } from "../../pkg/web/utils/logger";
const TinyGo = require("../vendor/tinygo/wasm_exec");
const Go = require("../vendor/go/wasm_exec");

const transporterConfig: ExtendedRTCConfiguration = {
  iceServers: [
    {
      urls: "stun:global.stun.twilio.com:3478?transport=udp",
    },
  ],
};

const {
  signalingServerAddress,
  reconnectTimeout,

  subnetPrefix,

  useC,
  useGo,
  useTinyGo,

  useJSSI,
  useWASI,

  useBerkeley,
  useNet,
  useTCP,

  runServer,
} = yargs(process.argv.slice(2)).options({
  signalingServerAddress: {
    description: "Signaling server address",
    default: "ws://localhost:6999",
  },
  reconnectTimeout: {
    description: "Reconnect timeout in milliseconds",
    default: 1000,
  },

  subnetPrefix: {
    description: "Subnet prefix to advertise",
    default: "10.0.0",
  },

  useC: {
    description: "Use the C implementation",
    default: false,
  },
  useGo: {
    description: "Use the Go implementation",
    default: false,
  },
  useTinyGo: {
    description: "Use the TinyGo implementation",
    default: false,
  },

  useBerkeley: {
    description: "Use the Berkeley style sockets implementation",
    default: false,
  },
  useNet: {
    description: "Use the net style sockets implementation",
    default: false,
  },
  useTCP: {
    description: "Use the TCP style sockets implementation",
    default: false,
  },

  useJSSI: {
    description: "Use the JavaScript system interface",
    default: false,
  },
  useWASI: {
    description: "Use the WebAssembly system interface",
    default: false,
  },

  runServer: {
    description: "Run the server implementation",
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
  signalingServerAddress,
  reconnectTimeout,
  subnetPrefix,
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

(async () => {
  if (useC) {
    if (useWASI && useBerkeley) {
      const wasi = new WASI();
      const {
        memoryId,
        imports: socketEnvImports,
      } = await sockets.getImports();

      const instance = await Asyncify.instantiate(
        await WebAssembly.compile(
          runServer && useBerkeley
            ? fs.readFileSync("./examples/c/out/echo_server.wasm")
            : fs.readFileSync("./examples/c/out/echo_client.wasm")
        ),
        {
          wasi_snapshot_preview1: wasi.wasiImport,
          env: socketEnvImports,
        }
      );

      sockets.setMemory(memoryId, instance.exports.memory);

      wasi.start(instance);
    }
  } else if (useGo) {
    if (useJSSI) {
      const go = new Go();
      const {
        memoryId,
        imports: socketEnvImports,
      } = await sockets.getImports();

      const instance = await WebAssembly.instantiate(
        await WebAssembly.compile(
          runServer
            ? useBerkeley
              ? fs.readFileSync(
                  "./examples/go/out/go/berkeley_echo_server.wasm"
                )
              : useNet
              ? fs.readFileSync("./examples/go/out/go/net_echo_server.wasm")
              : useTCP
              ? fs.readFileSync("./examples/go/out/go/tcp_echo_server.wasm")
              : undefined!
            : useBerkeley
            ? fs.readFileSync("./examples/go/out/go/berkeley_echo_client.wasm")
            : useNet
            ? fs.readFileSync("./examples/go/out/go/net_echo_client.wasm")
            : useTCP
            ? fs.readFileSync("./examples/go/out/go/tcp_echo_client.wasm")
            : undefined!
        ),
        go.importObject
      );

      (global as any).berkeleySockets = socketEnvImports;

      sockets.setMemory(memoryId, (instance.exports as any).mem);

      go.run(instance);

      (global as any).berkeleySockets = undefined;
    }
  } else if (useTinyGo) {
    if (useJSSI) {
      const go = new TinyGo();
      const {
        memoryId,
        imports: socketEnvImports,
      } = await sockets.getImports();

      const instance = await WebAssembly.instantiate(
        await WebAssembly.compile(
          runServer
            ? useBerkeley
              ? fs.readFileSync(
                  "./examples/go/out/tinygo/berkeley_echo_server.wasm"
                )
              : undefined!
            : useBerkeley
            ? fs.readFileSync(
                "./examples/go/out/tinygo/berkeley_echo_client.wasm"
              )
            : undefined!
        ),
        go.importObject
      );

      (global as any).berkeleySockets = socketEnvImports;

      sockets.setMemory(memoryId, (instance.exports as any).memory);

      go.run(instance);

      (global as any).berkeleySockets = undefined;
    } else if (useWASI) {
      const wasi = new WASI();
      const go = new TinyGo();
      const {
        memoryId,
        imports: socketEnvImports,
      } = await sockets.getImports();

      const instance = await Asyncify.instantiate(
        await WebAssembly.compile(
          runServer
            ? useBerkeley
              ? fs.readFileSync(
                  "./examples/go/out/tinygo/berkeley_echo_server_wasi.wasm"
                )
              : useNet
              ? fs.readFileSync(
                  "./examples/go/out/tinygo/net_echo_server_wasi.wasm"
                )
              : useTCP
              ? fs.readFileSync(
                  "./examples/go/out/tinygo/tcp_echo_server_wasi.wasm"
                )
              : undefined!
            : useBerkeley
            ? fs.readFileSync(
                "./examples/go/out/tinygo/berkeley_echo_client_wasi.wasm"
              )
            : useNet
            ? fs.readFileSync(
                "./examples/go/out/tinygo/net_echo_client_wasi.wasm"
              )
            : useTCP
            ? fs.readFileSync(
                "./examples/go/out/tinygo/tcp_echo_client_wasi.wasm"
              )
            : undefined!
        ),
        {
          wasi_unstable: wasi.wasiImport,
          env: {
            ...go.importObject.env,
            ...socketEnvImports,
          },
        }
      );

      sockets.setMemory(memoryId, (instance.exports as any).memory);

      wasi.start(instance);
    }
  }
})();

signalingClient.open();
