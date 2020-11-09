import fs from "fs";
import { WASI } from "wasi";
import BerkeleySocketManager from "../lib/berkeley_socket_manager.js";
import EventEmitter from "events";
import Asyncify from "asyncify-wasm";

const SERVER_BINARY_PATH = "./src/server_example.wasm";
const CLIENT_BINARY_PATH = "./src/client_example.wasm";

const mockConnection = new EventEmitter();

// Server
(async () => {
  const wasi = new WASI();
  const berkeleySocketManager = new BerkeleySocketManager.Builder()
    .setGetConnection(async (_, port, addr) => {
      return {
        send: async (message) => {
          await mockConnection.emit(`${addr}:${port}-server`, message);
        },
      };
    })
    .setGetReceiver(async (_, port, addr) => {
      const receiverBroadcaster = new EventEmitter();

      mockConnection.on(`${addr}:${port}-client`, async (message) =>
        setTimeout(
          async () => await receiverBroadcaster.emit("message", message),
          500
        )
      );

      return receiverBroadcaster;
    })
    .build();

  const instance = await Asyncify.instantiate(
    await WebAssembly.compile(fs.readFileSync(SERVER_BINARY_PATH)),
    {
      wasi_snapshot_preview1: wasi.wasiImport,
      env: berkeleySocketManager.getImports(),
    }
  );

  berkeleySocketManager.setMemory(instance.exports.memory);

  wasi.start(instance);
})();

// Client
(async () => {
  const wasi = new WASI();
  const berkeleySocketManager = new BerkeleySocketManager.Builder()
    .setGetConnection(async (_, port, addr) => {
      return {
        send: async (message) => {
          await mockConnection.emit(`${addr}:${port}-client`, message);
        },
      };
    })
    .setGetReceiver(async (_, port, addr) => {
      const receiverBroadcaster = new EventEmitter();

      mockConnection.on(`${addr}:${port}-server`, async (message) =>
        setTimeout(
          async () => await receiverBroadcaster.emit("message", message),
          500
        )
      );

      return receiverBroadcaster;
    })
    .build();

  const instance = await Asyncify.instantiate(
    await WebAssembly.compile(fs.readFileSync(CLIENT_BINARY_PATH)),
    {
      wasi_snapshot_preview1: wasi.wasiImport,
      env: berkeleySocketManager.getImports(),
    }
  );

  berkeleySocketManager.setMemory(instance.exports.memory);

  wasi.start(instance);
})();
