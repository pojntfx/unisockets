import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface IGoodbyeData {
  id: string;
}

export class Goodbye implements ISignalingOperation<IGoodbyeData> {
  opcode = ESIGNALING_OPCODES.GOODBYE;

  constructor(public data: IGoodbyeData) {}
}
