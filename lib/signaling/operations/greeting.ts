import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface IGreetingData {
  offererId: string;
  answererId: string;
}

export class Greeting implements ISignalingOperation<IGreetingData> {
  opcode = ESIGNALING_OPCODES.GREETING;

  constructor(public data: IGreetingData) {}
}
