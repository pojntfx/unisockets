export class ClientDoesNotExistError extends Error {
  constructor() {
    super("client does not exist");
  }
}
