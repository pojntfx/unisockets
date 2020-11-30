import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface IAcceptingData {
  id: string;
  alias: string;
}

export class Accepting implements ISignalingOperation<IAcceptingData> {
  opcode = ESIGNALING_OPCODES.ACCEPTING;

  constructor(public data: IAcceptingData) {}
}
