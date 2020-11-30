export class ConnectionDoesNotExistError extends Error {
  constructor() {
    super("connection does not exist");
  }
}
