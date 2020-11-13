import { IGoneData } from "./gone";
import { IAcknowledgementData } from "./acknowledgement";
import { IOfferData } from "./offer";
import { IAnswerData } from "./answer";

export enum ESIGNALING_OPCODES {
  GONE,
  ACKNOWLEDGED,
  OFFER,
  ANSWER,
}

export type TSignalingData =
  | IGoneData
  | IAcknowledgementData
  | IOfferData
  | IAnswerData;

export interface ISignalingOperation<T> {
  opcode: ESIGNALING_OPCODES;

  data: T;
}
