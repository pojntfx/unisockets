import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface IKnockData {
  subnet: string;
}

export class Knock implements ISignalingOperation<IKnockData> {
  opcode = ESIGNALING_OPCODES.KNOCK;

  constructor(public data: IKnockData) {}
}
