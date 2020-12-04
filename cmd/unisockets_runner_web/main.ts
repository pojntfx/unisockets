#!/usr/bin/env node

import { WASI } from "@wasmer/wasi";
import { lowerI64Imports } from "@wasmer/wasm-transformer";
import * as Asyncify from "asyncify-wasm";
import Emittery from "emittery";
import { WasmFs } from "@wasmer/wasmfs";
import { ExtendedRTCConfiguration } from "wrtc";
import { AliasDoesNotExistError } from "../../pkg/web/signaling/errors/alias-does-not-exist";
import { SignalingClient } from "../../pkg/web/signaling/services/signaling-client";
import { SignalingServer } from "../../pkg/web/signaling/services/signaling-server";
import { Sockets } from "../../pkg/web/sockets/sockets";
import { Transporter } from "../../pkg/web/transport/transporter";
import { getLogger } from "../../pkg/web/utils/logger";
import wasiBindings from "@wasmer/wasi/lib/bindings/browser";
const TinyGo = require("../../vendor/tinygo/wasm_exec");
const Go = require("../../vendor/go/wasm_exec");

const transporterConfig: ExtendedRTCConfiguration = {
  iceServers: [
    {
      urls: "stun:global.stun.twilio.com:3478?transport=udp",
    },
  ],
};

const runSignalingServer = false;
const runBinary = true;

const signalingServerListenAddress = "";

const signalingServerConnectAddress = "ws://localhost:6999";
const reconnectTimeout = 1000;
const subnetPrefix = "10.0.0";

const urlParams = new URLSearchParams(window.location.search);
const useServerBinary = urlParams.get("server");

const binaryPath = useServerBinary
  ? "out/c/echo_server.wasm"
  : "out/c/echo_client.wasm";

const useC = true;
const useGo = false;
const useTinyGo = false;

const useJSSI = false;
const useWASI = true;

const logger = getLogger();

if (runBinary) {
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
} else if (runSignalingServer) {
  const signalingServer = new SignalingServer(
    signalingServerListenAddress.split(":")[0],
    parseInt(signalingServerListenAddress.split(":")[1])
  );

  signalingServer.open();
}
