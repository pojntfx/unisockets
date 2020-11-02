import fs from "fs";
import { WASI } from "wasi";
import { BerkeleySockets } from "./berkeley_sockets.js";

(async () => {
  const wasi = new WASI();

  const wasm = await WebAssembly.compile(
    fs.readFileSync("./src/client_example.wasm")
  );

  const berkeleySockets = new BerkeleySockets();

  const instance = await WebAssembly.instantiate(wasm, {
    wasi_snapshot_preview1: wasi.wasiImport,
    env: {
      berkeley_sockets_socket: async (family, stream, option) =>
        await berkeleySockets.socket(family, stream, option),
      berkeley_sockets_connect: (socket, addressPointer, addressLength) => {
        return -1;
      },
      berkeley_sockets_send: (
        socket,
        messagePointer,
        messagePointerLength,
        option
      ) => {
        return -1;
      },
      berkeley_sockets_recv: (
        socket,
        messagePointer,
        messagePointerLength,
        option
      ) => {
        return -1;
      },
    },
  });

  wasi.start(instance);
})();
