export class BindRejectedError extends Error {
  constructor(idAlias: string) {
    super(`bind rejected by server: ${idAlias}`);
  }
}
