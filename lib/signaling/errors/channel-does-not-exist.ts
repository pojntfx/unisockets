export class ChannelDoesNotExistError extends Error {
  constructor() {
    super("channel does not exist");
  }
}
