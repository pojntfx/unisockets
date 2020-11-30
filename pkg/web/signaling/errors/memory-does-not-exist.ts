export class MemoryDoesNotExistError extends Error {
  constructor() {
    super("memory does not exist");
  }
}
