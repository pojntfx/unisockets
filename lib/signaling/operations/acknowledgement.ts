import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface IAcknowledgementData {
  id: string;
}

export class Acknowledgement
  implements ISignalingOperation<IAcknowledgementData> {
  opcode = ESIGNALING_OPCODES.ACKNOWLEDGED;

  constructor(public data: IAcknowledgementData) {}
}
