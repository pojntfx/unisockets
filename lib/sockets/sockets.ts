import { v4 } from "uuid";
import { MemoryDoesNotExistError } from "../signaling/errors/memory-does-not-exist";
import { SocketDoesNotExistError } from "../signaling/errors/socket-does-not-exist";
import { htons } from "../utils/htons";
import { getLogger } from "../utils/logger";

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

  async getImports() {
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

            const sockaddrInMemory = new Uint8Array(memory).slice(
              addressPointer,
              addressPointer + addressLength
            );

            const sin_addr = sockaddrInMemory.slice(4, 8);
            const sin_port = sockaddrInMemory.slice(2, 4);

            const addr = sin_addr.join(".");
            const port = htons(new Uint16Array(sin_port)[0]);

            await this.bind(fd, `${addr}:${port}`);

            return 0;
          } catch (e) {
            this.logger.error("Bind failed", e);

            return -1;
          }
        },
        berkeley_sockets_listen: async () => {
          return 0;
        },
      },
    };
  }

  async setMemory(memoryId: string) {
    if (!this.memories.has(memoryId)) {
      throw new MemoryDoesNotExistError();
    }
  }

  private async socket() {
    const fd = this.binds.size + 1;

    this.binds.set(fd, "");

    return fd;
  }

  private async bind(fd: number, alias: string) {
    await this.ensureBound(fd);

    await this.externalBind(alias);

    this.binds.set(fd, alias);
  }

  private async accept(serverFd: number) {
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
    await this.ensureBound(serverFd);

    this.binds.set(serverFd, alias);

    await this.externalConnect(alias);
  }

  private async send(fd: number, msg: Uint8Array) {
    await this.ensureBound(fd);

    await this.externalSend(this.binds.get(fd)!, msg); // ensureBound
  }

  private async recv(fd: number) {
    await this.ensureBound(fd);

    return this.externalRecv(this.binds.get(fd)!); // ensureBound
  }

  private async ensureBound(fd: number) {
    if (!this.binds.has(fd)) {
      throw new SocketDoesNotExistError();
    }
  }

  private async accessMemory(memoryId: string) {
    if (this.memories.has(memoryId)) {
      return this.memories.get(memoryId)!; // Checked by .has & we never push undefined
    } else {
      throw new MemoryDoesNotExistError();
    }
  }
}
