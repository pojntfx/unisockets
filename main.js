"use strict";
const fs = require("fs");
const { WASI } = require("wasi");
const wasi = new WASI();
const importObject = { wasi_snapshot_preview1: wasi.wasiImport };

(async () => {
  const sockets = [];

  const wasm = await WebAssembly.compile(fs.readFileSync("./client_wasm.wasm"));
  const instance = await WebAssembly.instantiate(wasm, {
    ...importObject,
    env: {
      berkeley_socket: (family, stream, options) => {
        console.log("family:", family, "stream:", stream, "options", options);

        const newSocketNum = sockets.length + 1;

        sockets[newSocketNum - 1] = () => {};

        return newSocketNum;
      },
      berkeley_connect: (socket, sockaddrPointer, socklen) => {
        console.log(
          "socket:",
          socket,
          "sockaddrPointer:",
          sockaddrPointer,
          "socket length:",
          socklen
        );

        const memory = new Uint8Array(instance.exports.memory.buffer);

        const port = memory.slice(sockaddrPointer, sockaddrPointer + 4);

        const remoteAddress = memory.slice(
          sockaddrPointer + 4,
          sockaddrPointer + 4 + 8
        );

        console.log(port, remoteAddress);

        return -1;
      },
      berkeley_send: (socket, message, messagelen, options) => {
        console.log(
          "socket:",
          socket,
          "message:",
          message,
          "message length:",
          messagelen,
          "options:",
          options
        );

        return -1;
      },
      berkeley_recv: (socket, messagePointer, messageLength, options) => {
        console.log(
          "socket:",
          socket,
          "message pointer",
          messagePointer,
          "message length:",
          messageLength,
          "options:",
          options
        );

        return -1;
      },

      get_num_from_runtime: () => 5,
      transfer_num_pointer_to_runtime: (pointer) => {
        const memory = new Uint8Array(instance.exports.memory.buffer);

        console.log(pointer, "->", memory[pointer]);

        return 0;
      },
    },
  });

  wasi.start(instance);
})();
