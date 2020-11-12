import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface IGoneData {
  id: string;
}

export class Gone implements ISignalingOperation<IGoneData> {
  opcode = ESIGNALING_OPCODES.GONE;

  constructor(public data: IGoneData) {}
}
