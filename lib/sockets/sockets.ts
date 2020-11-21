import { SocketDoesNotExistError } from "../signaling/errors/socket-does-not-exist";

export class Sockets {
  private binds = new Map<number, string>();

  constructor(
    private externalBind: (alias: string) => Promise<void>,
    private externalAccept: (alias: string) => Promise<string>,
    private externalConnect: (alias: string) => Promise<void>,
    private externalSend: (alias: string, msg: Uint8Array) => Promise<void>,
    private externalRecv: (alias: string) => Promise<Uint8Array>
  ) {}

  async getImports() {}

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

  private async listen() {}

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
}
