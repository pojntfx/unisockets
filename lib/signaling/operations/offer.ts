import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface IOfferData {
  id: string;
  offer: string;
}

export class Offer implements ISignalingOperation<IOfferData> {
  opcode = ESIGNALING_OPCODES.OFFER;

  constructor(public data: IOfferData) {}
}
