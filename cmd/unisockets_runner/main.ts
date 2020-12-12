#!/usr/bin/env node

import { WASI } from "@wasmer/wasi";
import { lowerI64Imports } from "@wasmer/wasm-transformer";
import * as Asyncify from "asyncify-wasm";
import Emittery from "emittery";
import fs from "fs";
import { ExtendedRTCConfiguration } from "wrtc";
import yargs from "yargs";
import { AliasDoesNotExistError } from "../../pkg/web/signaling/errors/alias-does-not-exist";
import { SignalingClient } from "../../pkg/web/signaling/services/signaling-client";
import { SignalingServer } from "../../pkg/web/signaling/services/signaling-server";
import { Sockets } from "../../pkg/web/sockets/sockets";
import { Transporter } from "../../pkg/web/transport/transporter";
import { getLogger } from "../../pkg/web/utils/logger";
import Go from "../../vendor/go/wasm_exec.js";
import TinyGo from "../../vendor/tinygo/wasm_exec.js";

const transporterConfig: ExtendedRTCConfiguration = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

const {
  runSignalingServer,
  runBinary,

  signalingServerListenAddress,

  signalingServerConnectAddress,
  reconnectTimeout,
  subnetPrefix,

  binaryPath,

  useC,
  useGo,
  useTinyGo,

  useJSSI,
  useWASI,
} = yargs(process.argv.slice(2)).options({
  runSignalingServer: {
    description: "Run the signaling server",
    default: false,
  },
  runBinary: {
    description: "Run a binary",
    default: false,
  },

  signalingServerListenAddress: {
    description:
      "Signaling server listen address. You may also set the PORT env variable to change the port.",
    default: `0.0.0.0:${process.env.PORT || 6999}`,
  },

  signalingServerConnectAddress: {
    description: "Signaling server connect address",
    default: "wss://unisockets.herokuapp.com",
  },
  reconnectTimeout: {
    description: "Reconnect timeout in milliseconds",
    default: 1000,
  },
  subnetPrefix: {
    description: "Subnet prefix to advertise",
    default: "127.0.0",
  },

  binaryPath: {
    description: "Path to the binary to run",
    default: "main.wasm",
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

  useJSSI: {
    description: "Use the JavaScript system interface",
    default: false,
  },
  useWASI: {
    description: "Use the WebAssembly system interface",
    default: false,
  },
}).argv;

const logger = getLogger();

if (runBinary) {
  // Transporter handlers
  const handleTransporterConnectionConnect = async (id: string) => {
    logger.verbose("Handling transporter connection connect", { id });
  };
  const handleTransporterConnectionDisconnect = async (id: string) => {
    logger.verbose("Handling transporter connection disconnect", { id });
  };
  const handleTransporterChannelOpen = async (id: string) => {
    logger.verbose("Handling transporter connection open", { id });
  };
  const handleTransporterChannelClose = async (id: string) => {
    logger.verbose("Handling transporter connection close", { id });
  };

  const ready = new Emittery();

  const aliases = new Map<string, string>();
  const transporter = new Transporter(
    transporterConfig,
    handleTransporterConnectionConnect,
    handleTransporterConnectionDisconnect,
    handleTransporterChannelOpen,
    handleTransporterChannelClose
  );

  // Signaling client handlers
  const handleConnect = async () => {
    logger.verbose("Handling connect");
  };
  const handleDisconnect = async () => {
    logger.verbose("Handling disconnect");
  };
  const handleAcknowledgement = async (id: string, rejected: boolean) => {
    logger.debug("Handling acknowledgement", { id, rejected });

    if (rejected) {
      logger.error("Knock rejected", {
        id,
      });
    }

    await ready.emit("ready", true);
  };
  const getOffer = async (
    answererId: string,
    handleCandidate: (candidate: string) => Promise<any>
  ) => {
    const offer = await transporter.getOffer(answererId, handleCandidate);

    logger.verbose("Created offer", { answererId, offer });

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

    logger.verbose("Created answer for offer", { offererId, offer, answer });

    return answer;
  };
  const handleAnswer = async (
    offererId: string,
    answererId: string,
    answer: string
  ) => {
    logger.verbose("Handling answer", { offererId, answererId, answer });

    await transporter.handleAnswer(answererId, answer);
  };
  const handleCandidate = async (
    offererId: string,
    answererId: string,
    candidate: string
  ) => {
    logger.verbose("Handling candidate", { offererId, answererId, candidate });

    await transporter.handleCandidate(offererId, candidate);
  };
  const handleGoodbye = async (id: string) => {
    logger.verbose("Handling goodbye", { id });

    await transporter.shutdown(id);
  };
  const handleAlias = async (id: string, alias: string, set: boolean) => {
    logger.debug("Handling alias", { id });

    if (set) {
      logger.verbose("Setting alias", { id, alias });

      aliases.set(alias, id);

      logger.debug("New aliases", {
        aliases: JSON.stringify(Array.from(aliases)),
      });
    } else {
      logger.verbose("Removing alias", { id, alias });

      aliases.delete(alias);

      logger.debug("New aliases", {
        aliases: JSON.stringify(Array.from(aliases)),
      });
    }
  };

  const signalingClient = new SignalingClient(
    signalingServerConnectAddress,
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

  // Socket handlers
  const handleExternalBind = async (alias: string) => {
    logger.verbose("Handling external bind", { alias });

    await signalingClient.bind(alias);
  };

  const handleExternalAccept = async (alias: string) => {
    logger.verbose("Handling external accept", { alias });

    return await signalingClient.accept(alias);
  };

  const handleExternalConnect = async (alias: string) => {
    logger.verbose("Handling external connect", { alias });

    await signalingClient.connect(alias);
  };

  const handleExternalSend = async (alias: string, msg: Uint8Array) => {
    logger.verbose("Handling external send", { alias, msg });

    if (aliases.has(alias)) {
      return await transporter.send(aliases.get(alias)!, msg); // .has
    } else {
      logger.error("Could not find alias", { alias });
    }
  };

  const handleExternalRecv = async (alias: string) => {
    if (aliases.has(alias)) {
      const msg = await transporter.recv(aliases.get(alias)!); // .has

      logger.verbose("Handling external recv", { alias, msg });

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

  // WASM runner
  (async () => {
    await ready.once("ready");

    if (useC) {
      if (useWASI) {
        const wasi = new WASI({
          args: [],
          env: {},
        });
        const {
          memoryId,
          imports: socketEnvImports,
        } = await sockets.getImports();

        const module = await WebAssembly.compile(
          await lowerI64Imports(new Uint8Array(fs.readFileSync(binaryPath)))
        );
        const instance = await Asyncify.instantiate(module, {
          ...wasi.getImports(module),
          env: socketEnvImports,
        });

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
          await WebAssembly.compile(fs.readFileSync(binaryPath)),
          go.importObject
        );

        (global as any).jssiImports = {};
        (global as any).jssiImports.berkeleySockets = socketEnvImports;

        sockets.setMemory(memoryId, (instance.exports as any).mem);

        go.run(instance);
      }
    } else if (useTinyGo) {
      if (useJSSI) {
        const go = new TinyGo();
        const {
          memoryId,
          imports: socketEnvImports,
        } = await sockets.getImports();

        const instance = await WebAssembly.instantiate(
          await WebAssembly.compile(fs.readFileSync(binaryPath)),
          go.importObject
        );

        (global as any).jssiImports = {};
        (global as any).jssiImports.berkeleySockets = socketEnvImports;

        sockets.setMemory(memoryId, (instance.exports as any).memory);

        go.run(instance);
      } else if (useWASI) {
        const wasi = new WASI({
          args: [],
          env: {},
        });
        const {
          memoryId,
          imports: socketEnvImports,
        } = await sockets.getImports();
        const go = new TinyGo();

        const module = await WebAssembly.compile(
          await lowerI64Imports(new Uint8Array(fs.readFileSync(binaryPath)))
        );
        const instance = await Asyncify.instantiate(module, {
          ...wasi.getImports(module),
          env: {
            ...go.importObject.env,
            ...socketEnvImports,
          },
        });

        sockets.setMemory(memoryId, instance.exports.memory);

        wasi.start(instance);
      }
    }
  })();

  signalingClient.open();
} else if (runSignalingServer) {
  const signalingServer = new SignalingServer(
    signalingServerListenAddress.split(":")[0],
    parseInt(signalingServerListenAddress.split(":")[1])
  );

  signalingServer.open();
}
