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
      berkeley_sockets_socket: (family, stream, option) =>
        berkeleySockets.socket(family, stream, option),
      berkeley_sockets_connect: (fd, addressPointer, addressSize) => {
        const sockaddrInMemory = new Uint8Array(
          instance.exports.memory.buffer
        ).slice(addressPointer, addressPointer + addressSize);

        const sin_family = sockaddrInMemory.slice(0, 2);
        const sin_port = sockaddrInMemory.slice(2, 4);
        const sin_addr = sockaddrInMemory.slice(4, 8);

        const family = new Int32Array(sin_family)[0];
        const port = berkeleySockets.htons(new Uint16Array(sin_port)[0]);
        const addr = sin_addr.join(".");

        const socket = berkeleySockets.getSocketByFileDescriptor(fd);

        socket.connect(family, port, addr);

        return 0;
      },
      berkeley_sockets_send: (
        fd,
        messagePointer,
        messagePointerLength,
        option
      ) => {
        const message = new Uint8Array(instance.exports.memory.buffer).slice(
          messagePointer,
          messagePointer + messagePointerLength
        );

        const socket = berkeleySockets.getSocketByFileDescriptor(fd);

        socket.send(message, option);

        return message.length;
      },
      berkeley_sockets_recv: (
        fd,
        messagePointer,
        messagePointerLength,
        option
      ) => {
        const socket = berkeleySockets.getSocketByFileDescriptor(fd);

        const message = socket.recv(option);

        // TODO: Write message into memory at messagePointer

        return message.length;
      },
    },
  });

  wasi.start(instance);
})();
