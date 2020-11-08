import fs from "fs";
import { WASI } from "wasi";
import BerkeleySocketManager from "../lib/berkeley_socket_manager.js";
import EventEmitter from "events";

const BINARY_PATH = "./src/client_example.wasm";

(async () => {
  const wasi = new WASI();
  const berkeleySocketManager = new BerkeleySocketManager.Builder()
    .setGetConnection((family, port, addr) => {
      console.log(`Getting connection for ${family} ${addr}:${port}`);

      // TODO: Return connection here
    })
    .setGetReceiver((family, port, addr) => {
      console.log(`Getting receiver for ${family} ${addr}:${port}`);

      const receiverBroadcaster = new EventEmitter();

      // TODO: Connect to or return connection receiver

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
