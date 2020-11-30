export class ClientClosedError extends Error {
  constructor() {
    super("client is closed");
  }
}
