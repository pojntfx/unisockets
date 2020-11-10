import fs from "fs";
import { WASI } from "wasi";
import BerkeleySocketManager from "../lib/berkeley_socket_manager.js";
import EventEmitter from "events";
import Asyncify from "asyncify-wasm";

// TODO: Connect mockConnection to actual connection
const mockConnection = new EventEmitter();

// Client
(async () => {
  const wasi = new WASI();
  const berkeleySocketManager = new BerkeleySocketManager.Builder()
    .setGetConnection(async (_, port, addr) => {
      return {
        send: async (message) => {
          await mockConnection.emit(`${addr}:${port}`, message);
        },
      };
    })
    .setGetReceiver(async (_, port, addr) => {
      const receiverBroadcaster = new EventEmitter();

      mockConnection.on(`${addr}:${port}`, async (message) =>
        setTimeout(
          async () => await receiverBroadcaster.emit("message", message),
          500
        )
      );

      return receiverBroadcaster;
    })
    .build();

  const instance = await Asyncify.instantiate(
    await WebAssembly.compile(fs.readFileSync("./src/client_example.wasm")),
    {
      wasi_snapshot_preview1: wasi.wasiImport,
      env: berkeleySocketManager.getImports(),
    }
  );

  berkeleySocketManager.setMemory(instance.exports.memory);

  wasi.start(instance);
})();
