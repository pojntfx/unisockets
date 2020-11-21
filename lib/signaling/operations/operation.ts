import { IAcceptData } from "./accept";
import { IAcceptingData } from "./accepting";
import { IAcknowledgementData } from "./acknowledgement";
import { IAliasData } from "./alias";
import { IAnswerData } from "./answer";
import { IBindData } from "./bind";
import { ICandidateData } from "./candidate";
import { IConnectData } from "./connect";
import { IGoodbyeData } from "./goodbye";
import { IGreetingData } from "./greeting";
import { IKnockData } from "./knock";
import { IOfferData } from "./offer";
import { IShutdownData } from "./shutdown";

export enum ESIGNALING_OPCODES {
  GOODBYE = "goodbye",
  KNOCK = "knock",
  ACKNOWLEDGED = "acknowledged",
  GREETING = "greeting",
  OFFER = "offer",
  ANSWER = "answer",
  CANDIDATE = "candidate",
  BIND = "bind",
  ACCEPTING = "accepting",
  ALIAS = "alias",
  SHUTDOWN = "shutdown",
  CONNECT = "connect",
  ACCEPT = "accept",
}

export type TSignalingData =
  | IGoodbyeData
  | IKnockData
  | IAcknowledgementData
  | IGreetingData
  | IOfferData
  | IAnswerData
  | ICandidateData
  | IBindData
  | IAcceptingData
  | IAliasData
  | IShutdownData
  | IConnectData
  | IAcceptData;

export interface ISignalingOperation<T> {
  opcode: ESIGNALING_OPCODES;

  data: T;
}
