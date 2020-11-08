import fs from "fs";
import { WASI } from "wasi";
import BerkeleySocketManager from "../lib/berkeley_socket_manager.js";
import EventEmitter from "events";

const BINARY_PATH = "./src/client_example.wasm";

const mockConnection = new EventEmitter();

(async () => {
  const wasi = new WASI();
  const berkeleySocketManager = new BerkeleySocketManager.Builder()
    .setGetConnection((family, port, addr) => {
      console.log(`Getting connection for ${family} ${addr}:${port}`);

      return {
        send: (message) => {
          mockConnection.emit(`${addr}:${port}`, message);
        },
      };
    })
    .setGetReceiver((family, port, addr) => {
      console.log(`Getting receiver for ${family} ${addr}:${port}`);

      const receiverBroadcaster = new EventEmitter();

      mockConnection.on(`${addr}:${port}`, (message) =>
        receiverBroadcaster.emit("message", message)
      );

      return receiverBroadcaster;
    })
    .build();

  const instance = await WebAssembly.instantiate(
    await WebAssembly.compile(fs.readFileSync(BINARY_PATH)),
    {
      wasi_snapshot_preview1: wasi.wasiImport,
      env: berkeleySocketManager.getImports(),
    }
  );

  berkeleySocketManager.setMemory(instance.exports.memory);

  wasi.start(instance);
})();
