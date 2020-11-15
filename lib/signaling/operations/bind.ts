import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface IBindData {
  id: string;
  alias: string;
}

export class Bind implements ISignalingOperation<IBindData> {
  opcode = ESIGNALING_OPCODES.BIND;

  constructor(public data: IBindData) {}
}
