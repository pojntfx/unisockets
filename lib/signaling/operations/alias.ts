import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface IAliasData {
  id: string;
  alias: string;
  accepted: boolean;
}

export class Alias implements ISignalingOperation<IAliasData> {
  opcode = ESIGNALING_OPCODES.ALIAS;

  constructor(public data: IAliasData) {}
}
