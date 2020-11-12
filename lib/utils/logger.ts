import { createLogger } from "winston";
import { Console } from "winston/lib/winston/transports";

export const getLogger = () =>
  createLogger({ transports: new Console(), level: process.env.LOG_LEVEL });
