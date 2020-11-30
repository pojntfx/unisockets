export class PortAlreadyAllocatedError extends Error {
  constructor() {
    super("port already allocated");
  }
}
