export class ShutdownRejectedError extends Error {
  constructor(idAlias: string) {
    super(`shutdown rejected by server: ${idAlias}`);
  }
}
