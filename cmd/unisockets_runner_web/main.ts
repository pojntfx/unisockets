(window as any).setImmediate = window.setInterval; // Polyfill

import { WASI } from "@wasmer/wasi";
import wasiBindings from "@wasmer/wasi/lib/bindings/browser";
import { lowerI64Imports } from "@wasmer/wasm-transformer";
import { WasmFs } from "@wasmer/wasmfs";
import * as Asyncify from "asyncify-wasm";
import Emittery from "emittery";
import { ExtendedRTCConfiguration } from "wrtc";
import { AliasDoesNotExistError } from "../../pkg/web/signaling/errors/alias-does-not-exist";
import { SignalingClient } from "../../pkg/web/signaling/services/signaling-client";
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

const signalingServerConnectAddress = "ws://localhost:6999";
const reconnectTimeout = 1000;
const subnetPrefix = "127.0.0";

const urlParams = new URLSearchParams(window.location.search);
const useServerBinary = urlParams.get("server");

const binaryPath = useServerBinary
  ? "go/echo_server.wasm"
  : "go/echo_client.wasm";

const useC = false;
const useGo = true;
const useTinyGo = false;

const useJSSI = true;
const useWASI = false;

const logger = getLogger();

// Transporter handlers
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

  await ready.emit("ready", true);
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

// WASM runner
(async () => {
  await ready.once("ready");

  if (useC) {
    if (useWASI) {
      const wasmFs = new WasmFs();
      const wasi = new WASI({
        args: [],
        env: {},
        bindings: {
          ...wasiBindings,
          fs: wasmFs.fs,
        },
      });
      const {
        memoryId,
        imports: socketEnvImports,
      } = await sockets.getImports();

      const module = await WebAssembly.compile(
        await lowerI64Imports(
          new Uint8Array(await (await fetch(binaryPath)).arrayBuffer())
        )
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
        await WebAssembly.compile(
          await (await fetch(binaryPath)).arrayBuffer()
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
          await (await fetch(binaryPath)).arrayBuffer()
        ),
        go.importObject
      );

      (global as any).berkeleySockets = socketEnvImports;

      sockets.setMemory(memoryId, (instance.exports as any).memory);

      go.run(instance);

      (global as any).berkeleySockets = undefined;
    } else if (useWASI) {
      const wasmFs = new WasmFs();
      const wasi = new WASI({
        args: [],
        env: {},
        bindings: {
          ...wasiBindings,
          fs: wasmFs.fs,
        },
      });
      const {
        memoryId,
        imports: socketEnvImports,
      } = await sockets.getImports();
      const go = new TinyGo();

      const module = await WebAssembly.compile(
        await lowerI64Imports(
          new Uint8Array(await (await fetch(binaryPath)).arrayBuffer())
        )
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
