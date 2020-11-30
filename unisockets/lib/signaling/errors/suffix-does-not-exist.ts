export class SuffixDoesNotExistError extends Error {
  constructor() {
    super("suffix does not exist");
  }
}
