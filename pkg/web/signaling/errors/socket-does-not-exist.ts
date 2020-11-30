export class SocketDoesNotExistError extends Error {
  constructor() {
    super("socket does not exist");
  }
}
