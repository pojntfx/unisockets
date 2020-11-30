export class SubnetDoesNotExistError extends Error {
  constructor() {
    super("subnet does not exist");
  }
}
