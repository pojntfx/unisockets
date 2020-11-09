import fs from "fs";
import { WASI } from "wasi";
import BerkeleySocketManager from "../lib/berkeley_socket_manager.js";
import EventEmitter from "events";
import Asyncify from "asyncify-wasm";

const BINARY_PATH = "./src/server_example.wasm";

const mockConnection = new EventEmitter();

(async () => {
  const wasi = new WASI();
  const berkeleySocketManager = new BerkeleySocketManager.Builder()
    .setGetConnection(async (_, port, addr) => {
      setInterval(
        () =>
          mockConnection.emit(
            `${addr}:${port}`,
            new TextEncoder().encode("Hey, server!")
          ),
        1000
      );

      return {
        send: async (message) => {
          // await mockConnection.emit(`${addr}:${port}`, message); // This would cause a feedback loop with the mocked connection
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
    await WebAssembly.compile(fs.readFileSync(BINARY_PATH)),
    {
      wasi_snapshot_preview1: wasi.wasiImport,
      env: berkeleySocketManager.getImports(),
    }
  );

  berkeleySocketManager.setMemory(instance.exports.memory);

  wasi.start(instance);
})();
