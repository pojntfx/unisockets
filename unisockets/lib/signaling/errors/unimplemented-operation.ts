import { ESIGNALING_OPCODES } from "../operations/operation";

export class UnimplementedOperationError extends Error {
  constructor(opcode: ESIGNALING_OPCODES) {
    super(`unimplemented operation ${opcode}`);
  }
}
