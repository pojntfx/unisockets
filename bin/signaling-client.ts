import { v4 } from "uuid";
import yargs from "yargs";
import { SignalingClient } from "../lib/signaling/services/signaling-client";
import { getLogger } from "../lib/utils/logger";

const logger = getLogger();

const getOffer = async () => v4();
const getAnswer = async (_: string) => v4();
const onAnswer = async (answererId: string, answer: string) => {
  logger.info("Handling answer", { answererId, answer });
};

const { raddr, reconnectDuration } = yargs(process.argv.slice(2)).options({
  raddr: {
    description: "Remote address",
    default: "ws://localhost:6999",
  },
  reconnectDuration: {
    description: "Reconnect duration in milliseconds",
    default: 1000,
  },
}).argv;

const client = new SignalingClient(
  raddr,
  reconnectDuration,
  getOffer,
  getAnswer,
  onAnswer
);

client.open();
