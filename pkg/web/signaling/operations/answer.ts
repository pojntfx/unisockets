import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface IAnswerData {
  offererId: string;
  answererId: string;
  answer: string;
}

export class Answer implements ISignalingOperation<IAnswerData> {
  opcode = ESIGNALING_OPCODES.ANSWER;

  constructor(public data: IAnswerData) {}
}
