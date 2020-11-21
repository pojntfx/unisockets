import { IAcceptData } from "./accept";
import { IAcceptingData } from "./accepting";
import { IWelcomeData } from "./welcome";
import { IAliasData } from "./alias";
import { IAnswerData } from "./answer";
import { IBindData } from "./bind";
import { ICandidateData } from "./candidate";
import { IConnectData } from "./connect";
import { IGoodbyeData } from "./goodbye";
import { IGreetingData } from "./greeting";
import { IOfferData } from "./offer";
import { IShutdownData } from "./shutdown";

export enum ESIGNALING_OPCODES {
  GOODBYE = "goodbye",
  WELCOME = "welcome",
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
  | IWelcomeData
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
