import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface IAliasData {
  id: string;
  alias: string;
  set: boolean;
  clientConnectionId?: string;
  isConnectionAlias?: boolean;
}

export class Alias implements ISignalingOperation<IAliasData> {
  opcode = ESIGNALING_OPCODES.ALIAS;

  constructor(public data: IAliasData) {}
}
