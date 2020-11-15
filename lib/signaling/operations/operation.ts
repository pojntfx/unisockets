import { IAcknowledgementData } from "./acknowledgement";
import { IAliasData } from "./alias";
import { IAnswerData } from "./answer";
import { IBindData } from "./bind";
import { ICandidateData } from "./candidate";
import { IGoodbyeData } from "./goodbye";
import { IOfferData } from "./offer";
import { IShutdownData } from "./shutdown";

export enum ESIGNALING_OPCODES {
  GOODBYE = "goodbye",
  ACKNOWLEDGED = "acknowledged",
  OFFER = "offer",
  ANSWER = "answer",
  CANDIDATE = "candidate",
  BIND = "bind",
  ALIAS = "alias",
  SHUTDOWN = "shutdown",
}

export type TSignalingData =
  | IGoodbyeData
  | IAcknowledgementData
  | IOfferData
  | IAnswerData
  | ICandidateData
  | IBindData
  | IAliasData
  | IShutdownData;

export interface ISignalingOperation<T> {
  opcode: ESIGNALING_OPCODES;

  data: T;
}
