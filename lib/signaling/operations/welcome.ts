import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface IWelcomeData {
  id: string;
}

export class Welcome implements ISignalingOperation<IWelcomeData> {
  opcode = ESIGNALING_OPCODES.WELCOME;

  constructor(public data: IWelcomeData) {}
}
