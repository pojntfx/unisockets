import BerkeleySocket from "./berkeley_socket.js";

export default class BerkeleySocketManager {
  #sockets = new Map();
  #memory = undefined;

  #getConnection = () => {};
  #getReceiver = () => {};

  constructor(getConnection, getReceiver) {
    this.#getConnection = getConnection;
    this.#getReceiver = getReceiver;
  }

  static Builder = class {
    #getConnection = () => {};
    #getReceiver = () => {};

    setGetConnection = (handler) => {
      this.#getConnection = handler;

      return this;
    };

    setGetReceiver = (handler) => {
      this.#getReceiver = handler;

      return this;
    };

    build() {
      return new BerkeleySocketManager(this.#getConnection, this.#getReceiver);
    }
  };

  #htons = (val) => ((val & 0xff) << 8) | ((val >> 8) & 0xff);

  getImports() {
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
        const sockaddrInMemory = new Uint8Array(this.#memory.buffer).slice(
          addressPointer,
          addressPointer + addressLength
        );

        const sin_family = sockaddrInMemory.slice(0, 2);
        const sin_port = sockaddrInMemory.slice(2, 4);
        const sin_addr = sockaddrInMemory.slice(4, 8);

        const family = new Int32Array(sin_family)[0];
        const port = this.#htons(new Uint16Array(sin_port)[0]);
        const addr = sin_addr.join(".");

        const socket = this.#sockets.get(fd);
        socket.connect(
          this.#getConnection(family, port, addr),
          this.#getReceiver(family, port, addr)
        );

        return 0;
      },
      berkeley_sockets_send: async (
        fd,
        messagePointer,
        messagePointerLength,
        option
      ) => {
        const message = new Uint8Array(this.#memory.buffer).slice(
          messagePointer,
          messagePointer + messagePointerLength
        );

        const socket = this.#sockets.get(fd);
        await socket.send(message, option);

        return message.length;
      },
      berkeley_sockets_recv: (
        fd,
        messagePointer,
        messagePointerLength,
        option
      ) => {
        const socket = this.#sockets.get(fd);

        const message = socket.recv(option);

        const mem = new Uint8Array(this.#memory.buffer);
        message.forEach((messagePart, index) => {
          // Don't write over the boundary
          if (index <= messagePointerLength) {
            mem[messagePointer + index] = messagePart;
          }
        });

        return message.length;
      },
    };
  }

  setMemory(memory) {
    this.#memory = memory;
  }
}
