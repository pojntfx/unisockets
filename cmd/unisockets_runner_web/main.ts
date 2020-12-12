(window as any).setImmediate = window.setInterval; // Polyfill

import { WASI } from "@wasmer/wasi";
import wasiBindings from "@wasmer/wasi/lib/bindings/browser";
import { lowerI64Imports } from "@wasmer/wasm-transformer/lib/unoptimized/wasm-transformer.esm.js";
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
      urls: "stun:global.stun.twilio.com:3478?transport=udp",
    },
    {
      username:
        "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
      urls: "turn:global.turn.twilio.com:3478?transport=udp",
      credential: "w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=",
    },
    {
      username:
        "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
      urls: "turn:global.turn.twilio.com:3478?transport=tcp",
      credential: "w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=",
    },
    {
      username:
        "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
      urls: "turn:global.turn.twilio.com:443?transport=tcp",
      credential: "w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=",
    },
  ],
};

const signalingServerConnectAddress = "wss://unisockets.herokuapp.com";
const reconnectTimeout = 1000;
const subnetPrefix = "127.0.0";

const urlParams = new URLSearchParams(window.location.search);
const useServerBinary = urlParams.get("server");

const binaryPath = useServerBinary
  ? "out/go/echo_server.wasm"
  : "out/go/echo_client.wasm";

const useC = false;
const useGo = true;
const useTinyGo = false;

const useJSSI = true;
const useWASI = false;

const logger = getLogger();

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

      (global as any).fs.read = (
        _: number,
        buffer: Uint8Array,
        ___: number,
        ____: number,
        _____: number,
        callback: Function
      ) => {
        new Promise<Uint8Array>((res) => {
          const rawInput = prompt("value for stdin:");
          const input = new TextEncoder().encode(rawInput + "\n");

          buffer.set(input);

          res(input);
        }).then((input) => callback(null, input.length));
      };
      (global as any).jssiImports = socketEnvImports;

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
        await WebAssembly.compile(
          await (await fetch(binaryPath)).arrayBuffer()
        ),
        go.importObject
      );

      (global as any).fs.read = (
        _: number,
        buffer: Uint8Array,
        ___: number,
        ____: number,
        _____: number,
        callback: Function
      ) => {
        new Promise<Uint8Array>((res) => {
          const rawInput = prompt("value for stdin:");
          const input = new TextEncoder().encode(rawInput + "\n");

          buffer.set(input);

          res(input);
        }).then((input) => callback(null, input.length));
      };
      (global as any).jssiImports = socketEnvImports;

      sockets.setMemory(memoryId, (instance.exports as any).memory);

      go.run(instance);
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
