export enum ESIGNALING_OPCODES {
  ACKNOWLEDGED,
  GONE,
}

export interface ISignalingOperation {
  opcode: ESIGNALING_OPCODES;
}

export class Acknowledgement implements ISignalingOperation {
  opcode = ESIGNALING_OPCODES.ACKNOWLEDGED;

  constructor(public data: { id: string }) {}
}

export class Gone implements ISignalingOperation {
  opcode = ESIGNALING_OPCODES.GONE;

  constructor(public data: { id: string }) {}
}
