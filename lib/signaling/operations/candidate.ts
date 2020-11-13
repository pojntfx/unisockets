import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface ICandidateData {
  offererId: string;
  answererId: string;
  candidate: string;
}

export class Candidate implements ISignalingOperation<ICandidateData> {
  opcode = ESIGNALING_OPCODES.CANDIDATE;

  constructor(public data: ICandidateData) {}
}
