export class ConnectionRejectedError extends Error {
  constructor(idAlias: string) {
    super(`connection rejected by server: ${idAlias}`);
  }
}
