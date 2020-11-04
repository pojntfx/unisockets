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
        const sockaddrInMemory = new Uint8Array(
          instance.exports.memory.buffer
        ).slice(addressPointer, addressPointer + addressLength);

        const sin_family = sockaddrInMemory.slice(0, 2);
        const sin_port = sockaddrInMemory.slice(2, 4);
        const sin_addr = sockaddrInMemory.slice(4, 8);

        const family = new Int32Array(sin_family)[0];
        const port = berkeleySockets.htons(new Uint16Array(sin_port)[0]);
        const addr = sin_addr.join(".");

        const socket = berkeleySockets.getSocketByFileDescriptor(fd);

        socket.bind(family, port, addr);

        return 0;
      },
      berkeley_sockets_listen: (fd, maxClients) => {
        const socket = berkeleySockets.getSocketByFileDescriptor(fd);

        socket.listen(maxClients);

        return 0;
      },
      berkeley_sockets_accept: (fd, addressPointer, addressLengthPointer) => {
        const socket = berkeleySockets.getSocketByFileDescriptor(fd);

        const { family, port, address } = socket.accept();

        console.log("berkeley_sockets_accept", fd, family, port, address);

        const addressLength = new Int32Array(
          new Uint8Array(instance.exports.memory.buffer).slice(
            addressLengthPointer,
            addressLengthPointer + 4
          )
        )[0];

        const memory = new Uint8Array(instance.exports.memory.buffer);

        const sin_family = berkeleySockets.getUint2(family);
        const sin_port = berkeleySockets.getUint2(port);
        const sin_addr = address.split(".").map((e) => new Uint8Array([e])[0]);

        for (let i = 0; i < addressLength; i++) {
          const index = addressPointer + i;

          if (i >= 0 && i < 2) {
            memory[index] = sin_family[i];
          } else if (i >= 2 && i < 4) {
            memory[index] = sin_port[i - 2];
          } else if (i >= 4 && i < 8) {
            memory[index] = sin_addr[i - 4];
          }
        }

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
