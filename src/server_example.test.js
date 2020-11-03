import fs from "fs";
import { WASI } from "wasi";
import { BerkeleySockets } from "./berkeley_sockets.js";

(async () => {
  const wasi = new WASI();

  const wasm = await WebAssembly.compile(
    fs.readFileSync("./src/server_example.wasm")
  );

  const berkeleySockets = new BerkeleySockets();

  const instance = await WebAssembly.instantiate(wasm, {
    wasi_snapshot_preview1: wasi.wasiImport,
    env: {
      berkeley_sockets_socket: (family, stream, option) =>
        berkeleySockets.socket(family, stream, option),
      berkeley_sockets_bind: (fd, addressPointer, addressLength) => {
        console.log("berkeley_sockets_bind", fd, addressPointer, addressLength);

        return -1;
      },
      berkeley_sockets_listen: (fd, maxClients) => {
        console.log("berkeley_sockets_listen", fd, maxClients);

        return -1;
      },
      berkeley_sockets_accept: (fd, addressPointer, addressLengthPointer) => {
        console.log(
          "berkeley_sockets_accept",
          fd,
          addressPointer,
          addressLengthPointer
        );

        return -1;
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
