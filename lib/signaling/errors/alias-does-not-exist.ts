export class AliasDoesNotExistError extends Error {
  constructor() {
    super("alias does not exist");
  }
}
