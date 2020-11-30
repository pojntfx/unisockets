import { ESIGNALING_OPCODES, ISignalingOperation } from "./operation";

export interface IShutdownData {
  id: string;
  alias: string;
}

export class Shutdown implements ISignalingOperation<IShutdownData> {
  opcode = ESIGNALING_OPCODES.SHUTDOWN;

  constructor(public data: IShutdownData) {}
}
