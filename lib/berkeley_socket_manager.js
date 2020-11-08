import BerkeleySocket from "./berkeley_socket.js";

export default class BerkeleySocketManager {
  #sockets = new Map();

  #htons = (val) => ((val & 0xff) << 8) | ((val >> 8) & 0xff);

  getImports(memory) {
    return {
      berkeley_sockets_socket: (family, stream, option) => {
        const socket = new BerkeleySocket.Builder()
          .setFamily(family)
          .setStream(stream)
          .setOption(option)
          .build();

        const id = this.#sockets.size;
        this.#sockets.set(id, socket);

        return this.#sockets.get(id);
      },
      berkeley_sockets_connect: (fd, addressPointer, addressLength) => {
        const sockaddrInMemory = new Uint8Array(memory.buffer).slice(
          addressPointer,
          addressPointer + addressLength
        );

        const sin_family = sockaddrInMemory.slice(0, 2);
        const sin_port = sockaddrInMemory.slice(2, 4);
        const sin_addr = sockaddrInMemory.slice(4, 8);

        const family = new Int32Array(sin_family)[0];
        const port = this.#htons(new Uint16Array(sin_port)[0]);
        const addr = sin_addr.join(".");

        // TODO: Get socket by fd and connect to addr:port

        return 0;
      },
      berkeley_sockets_send: (
        fd,
        messagePointer,
        messagePointerLength,
        option
      ) => {
        const message = new Uint8Array(memory.buffer).slice(
          messagePointer,
          messagePointer + messagePointerLength
        );

        // TODO: Get socket by fd and send message

        return message.length;
      },
      berkeley_sockets_recv: (
        fd,
        messagePointer,
        messagePointerLength,
        option
      ) => {
        // TODO: Get socket by fd and receive message
      },
    };
  }
}
