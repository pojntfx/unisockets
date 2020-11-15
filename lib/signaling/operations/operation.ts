import { IGoodbyeData } from "./goodbye";
import { IAcknowledgementData } from "./acknowledgement";
import { IOfferData } from "./offer";
import { IAnswerData } from "./answer";
import { ICandidateData } from "./candidate";

export enum ESIGNALING_OPCODES {
  GOODBYE,
  ACKNOWLEDGED,
  OFFER,
  ANSWER,
  CANDIDATE,
}

export type TSignalingData =
  | IGoodbyeData
  | IAcknowledgementData
  | IOfferData
  | IAnswerData
  | ICandidateData;

export interface ISignalingOperation<T> {
  opcode: ESIGNALING_OPCODES;

  data: T;
}
