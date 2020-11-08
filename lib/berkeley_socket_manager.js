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

  #getUint2 = (val) => {
    const sinVal = new ArrayBuffer(4);

    new Int32Array(sinVal)[0] = val;

    return Array.from(new Uint8Array(sinVal));
  };

  getImports() {
    return {
      berkeley_sockets_socket: async (family, stream, option) => {
        const socket = new BerkeleySocket.Builder()
          .setFamily(family)
          .setStream(stream)
          .setOption(option)
          .build();

        const id = this.#sockets.size;
        this.#sockets.set(id, socket);

        return this.#sockets.get(id);
      },
      berkeley_sockets_bind: async (fd, addressPointer, addressLength) => {
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
        await socket.bind(
          family,
          port,
          addr,
          await this.#getConnection(family, port, addr),
          await this.#getReceiver(family, port, addr)
        );

        return 0;
      },
      berkeley_sockets_listen: async (fd, maxClients) => {
        const socket = this.#sockets.get(fd);
        await socket.listen(maxClients);

        return 0;
      },
      berkeley_sockets_accept: async (
        fd,
        addressPointer,
        addressLengthPointer
      ) => {
        const socket = this.#sockets.get(fd);
        const { family, port, address } = await socket.accept();

        const addressLength = new Int32Array(
          new Uint8Array(this.#memory.buffer).slice(
            addressLengthPointer,
            addressLengthPointer + 4
          )
        )[0];

        const memory = new Uint8Array(this.#memory.buffer);

        const sin_family = this.#getUint2(family);
        const sin_port = this.#getUint2(port);
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
      berkeley_sockets_connect: async (fd, addressPointer, addressLength) => {
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
        await socket.connect(
          await this.#getConnection(family, port, addr),
          await this.#getReceiver(family, port, addr)
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
      berkeley_sockets_recv: async (
        fd,
        messagePointer,
        messagePointerLength,
        option
      ) => {
        const socket = this.#sockets.get(fd);

        const message = await socket.recv(option);

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
