import fs from "fs";
import { WASI } from "wasi";
import { BerkeleySockets } from "./berkeley_sockets.js";

(async () => {
  const wasi = new WASI({
    preopens: {
      "/sockets": "/tmp",
    },
  });

  const wasm = await WebAssembly.compile(
    fs.readFileSync("./src/client_example.wasm")
  );

  const berkeleySockets = new BerkeleySockets();

  const instance = await WebAssembly.instantiate(wasm, {
    wasi_snapshot_preview1: {
      ...wasi.wasiImport,
      // See https://github.com/nodejs/wasi/blob/6fb2da347a6358b484c8981e247b088bcfc3a7ce/src/node_wasi.cc#L1582
      sock_send: (...args) => {
        const len = new Int32Array(
          new Uint8Array(instance.exports.memory.buffer).slice(
            args[4],
            args[4] + 4
          )
        );

        const socket = berkeleySockets.getSocketByFileDescriptor(args[0]);

        if (socket) {
          const message = new Uint8Array(instance.exports.memory.buffer).slice(
            args[1],
            args[1] + args[2] * 8
          );

          socket.send(message, args[3]);

          return message.length;
        } else {
          return wasi.wasiImport.sock_send(...args);
        }
      },
    },
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
      berkeley_sockets_recv: (
        fd,
        messagePointer,
        messagePointerLength,
        option
      ) => {
        const socket = berkeleySockets.getSocketByFileDescriptor(fd);

        const message = socket.recv(option);

        const memory = new Uint8Array(instance.exports.memory.buffer);
        message.forEach((messagePart, index) => {
          // Don't write over the boundary
          if (index <= messagePointerLength) {
            memory[messagePointer + index] = messagePart;
          }
        });

        return message.length;
      },
    },
  });

  wasi.start(instance);
})();
