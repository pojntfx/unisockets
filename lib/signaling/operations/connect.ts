import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface IConnectData {
  id: string;
  remoteAlias: string;
  clientConnectionId: string;
}

export class Connect implements ISignalingOperation<IConnectData> {
  opcode = ESIGNALING_OPCODES.CONNECT;

  constructor(public data: IConnectData) {}
}
