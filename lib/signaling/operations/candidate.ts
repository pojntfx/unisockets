import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface ICandidateData {
  offererId: string; // Who this candidate describes
  answererId: string; // Who this candidate should be delivered to
  candidate: string;
}

export class Candidate implements ISignalingOperation<ICandidateData> {
  opcode = ESIGNALING_OPCODES.CANDIDATE;

  constructor(public data: ICandidateData) {}
}
