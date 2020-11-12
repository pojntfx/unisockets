import { IAcknowledgementData } from "./acknowledgement";
import { IGoneData } from "./gone";

export enum ESIGNALING_OPCODES {
  ACKNOWLEDGED,
  GONE,
}

export type TSignalingData = IAcknowledgementData | IGoneData;

export interface ISignalingOperation<T> {
  opcode: ESIGNALING_OPCODES;

  data: T;
}
