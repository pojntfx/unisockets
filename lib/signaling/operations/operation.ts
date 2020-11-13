import { IGoneData } from "./gone";
import { IAcknowledgementData } from "./acknowledgement";
import { IOfferData } from "./offer";

export enum ESIGNALING_OPCODES {
  GONE,
  ACKNOWLEDGED,
  OFFER,
}

export type TSignalingData = IGoneData | IAcknowledgementData | IOfferData;

export interface ISignalingOperation<T> {
  opcode: ESIGNALING_OPCODES;

  data: T;
}
