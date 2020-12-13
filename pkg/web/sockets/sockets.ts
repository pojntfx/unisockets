import { v4 } from "uuid";
import { MemoryDoesNotExistError } from "../signaling/errors/memory-does-not-exist";
import { SocketDoesNotExistError } from "../signaling/errors/socket-does-not-exist";
import { getAsBinary } from "../utils/getAsBinary";
import { htons } from "../utils/htons";
import { getLogger } from "../utils/logger";

const AF_INET = 2;

// Matches pkg/unisockets/berkeley_sockets.h
interface ISocketImports {
  berkeley_sockets_socket: () => Promise<number>;
  berkeley_sockets_bind: (
    fd: number,
    addressPointer: number,
    addressLength: number
  ) => Promise<number>;
  berkeley_sockets_listen: () => Promise<number>;
  berkeley_sockets_accept: (
    fd: number,
    addressPointer: number,
    addressLengthPointer: number
  ) => Promise<number>;
  berkeley_sockets_connect: (
    fd: number,
    addressPointer: number,
    addressLength: number
  ) => Promise<number>;
  berkeley_sockets_send: (
    fd: number,
    messagePointer: number,
    messagePointerLength: number
  ) => Promise<number>;
  berkeley_sockets_recv: (
    fd: number,
    messagePointer: number,
    messagePointerLength: number
  ) => Promise<number>;
}

export class Sockets {
  private logger = getLogger();
  private binds = new Map<number, string>();
  private memories = new Map<string, Uint8Array>();

  constructor(
    private externalBind: (alias: string) => Promise<void>,
    private externalAccept: (alias: string) => Promise<string>,
    private externalConnect: (alias: string) => Promise<void>,
    private externalSend: (alias: string, msg: Uint8Array) => Promise<void>,
    private externalRecv: (alias: string) => Promise<Uint8Array>
  ) {}

  async getImports(): Promise<{ memoryId: string; imports: ISocketImports }> {
    this.logger.debug("Getting imports");

    const memoryId = v4();

    return {
      memoryId,
      imports: {
        berkeley_sockets_socket: async () => {
          return await this.socket();
        },
        berkeley_sockets_bind: async (
          fd: number,
          addressPointer: number,
          addressLength: number
        ) => {
          try {
            const memory = await this.accessMemory(memoryId);

            const socketInMemory = memory.slice(
              addressPointer,
              addressPointer + addressLength
            );

            const addressInMemory = socketInMemory.slice(4, 8);
            const portInMemory = socketInMemory.slice(2, 4);

            const address = addressInMemory.join(".");
            const port = htons(new Uint16Array(portInMemory.buffer)[0]);

            await this.bind(fd, `${address}:${port}`);

            return 0;
          } catch (e) {
            this.logger.error("Bind failed", { e });

            return -1;
          }
        },
        berkeley_sockets_listen: async () => {
          return 0;
        },
        berkeley_sockets_accept: async (
          fd: number,
          addressPointer: number,
          addressLengthPointer: number
        ) => {
          try {
            const memory = await this.accessMemory(memoryId);

            const { clientFd, clientAlias } = await this.accept(fd);

            const addressLength = new Int32Array(
              memory.slice(addressLengthPointer, addressLengthPointer + 4)
            )[0];

            const parts = clientAlias.split(":");

            const familyInMemory = getAsBinary(AF_INET);
            const portInMemory = getAsBinary(parseInt(parts[1]));
            const addressInMemory = parts[0]
              .split(".")
              .map((e) => Uint8Array.from([parseInt(e)])[0]);

            for (let i = 0; i < addressLength; i++) {
              const index = addressPointer + i;

              if (i >= 0 && i < 2) {
                memory[index] = familyInMemory[i];
              } else if (i >= 2 && i < 4) {
                memory[index] = portInMemory[i - 2];
              } else if (i >= 4 && i < 8) {
                memory[index] = addressInMemory[i - 4];
              }
            }

            return clientFd;
          } catch (e) {
            this.logger.error("Accept failed", { e });

            return -1;
          }
        },
        berkeley_sockets_connect: async (
          fd: number,
          addressPointer: number,
          addressLength: number
        ) => {
          try {
            const memory = await this.accessMemory(memoryId);

            const socketInMemory = memory.slice(
              addressPointer,
              addressPointer + addressLength
            );

            const addressInMemory = socketInMemory.slice(4, 8);
            const portInMemory = socketInMemory.slice(2, 4);

            const address = addressInMemory.join(".");
            const port = htons(new Uint16Array(portInMemory.buffer)[0]);

            await this.connect(fd, `${address}:${port}`);

            return 0;
          } catch (e) {
            this.logger.error("Connect failed", { e });

            return -1;
          }
        },
        berkeley_sockets_send: async (
          fd: number,
          messagePointer: number,
          messagePointerLength: number
        ) => {
          try {
            const memory = await this.accessMemory(memoryId);

            const msg = memory.slice(
              messagePointer,
              messagePointer + messagePointerLength
            );

            await this.send(fd, msg);

            return msg.length;
          } catch (e) {
            this.logger.error("Send failed", { e });

            return -1;
          }
        },
        berkeley_sockets_recv: async (
          fd: number,
          messagePointer: number,
          messagePointerLength: number
        ) => {
          try {
            const memory = await this.accessMemory(memoryId);

            const msg = await this.recv(fd);

            msg.forEach((messagePart, index) => {
              // Don't write over the boundary
              if (index <= messagePointerLength) {
                memory[messagePointer + index] = messagePart;
              }
            });

            return msg.length;
          } catch (e) {
            this.logger.error("Recv failed", { e });

            return -1;
          }
        },
      },
    };
  }

  private async socket() {
    this.logger.silly("Handling `socket`");

    const fd = this.binds.size + 1;

    this.binds.set(fd, "");

    return fd;
  }

  private async bind(fd: number, alias: string) {
    this.logger.silly("Handling `bind`", { fd, alias });

    await this.ensureBound(fd);

    await this.externalBind(alias);

    this.binds.set(fd, alias);
  }

  private async accept(serverFd: number) {
    this.logger.silly("Handling `accept`", { serverFd });

    await this.ensureBound(serverFd);

    const clientFd = await this.socket();
    const clientAlias = await this.externalAccept(this.binds.get(serverFd)!); // ensureBound

    this.binds.set(clientFd, clientAlias);

    return {
      clientFd,
      clientAlias,
    };
  }

  private async connect(serverFd: number, alias: string) {
    this.logger.silly("Handling `connect`", { serverFd, alias });

    await this.ensureBound(serverFd);

    this.binds.set(serverFd, alias);

    await this.externalConnect(alias);
  }

  private async send(fd: number, msg: Uint8Array) {
    this.logger.silly("Handling `send`", { fd, msg });

    await this.ensureBound(fd);

    await this.externalSend(this.binds.get(fd)!, msg); // ensureBound
  }

  private async recv(fd: number) {
    this.logger.silly("Handling `recv`", { fd });

    await this.ensureBound(fd);

    return this.externalRecv(this.binds.get(fd)!); // ensureBound
  }

  private async ensureBound(fd: number) {
    this.logger.silly("Ensuring bound", { fd });

    if (!this.binds.has(fd)) {
      throw new SocketDoesNotExistError();
    }
  }

  async setMemory(memoryId: string, memory: Uint8Array) {
    this.logger.debug("Setting memory", { memoryId });

    this.memories.set(memoryId, memory);
  }

  private async accessMemory(memoryId: string) {
    this.logger.silly("Accessing memory", { memoryId });

    if (this.memories.has(memoryId)) {
      return new Uint8Array(this.memories.get(memoryId)!.buffer); // Checked by .has & we never push undefined
    } else {
      throw new MemoryDoesNotExistError();
    }
  }
}
