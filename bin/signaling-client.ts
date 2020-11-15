import { v4 } from "uuid";
import yargs from "yargs";
import { SignalingClient } from "../lib/signaling/services/signaling-client";
import { getLogger } from "../lib/utils/logger";

const logger = getLogger();

const aliases = new Map<string, string>();

const getOffer = async () => v4();
const getAnswer = async (_: string) => v4();
const handleAnswer = async (
  offererId: string,
  answererId: string,
  answer: string,
  handleCandidate: (candidate: string) => Promise<any>
) => {
  logger.info("Handling answer", { offererId, answererId, answer });

  await handleCandidate(v4());
  await handleCandidate(v4());
  await handleCandidate(v4());
};
const handleCandidate = async (
  offererId: string,
  answererId: string,
  candidate: string
) => {
  logger.info("Handling candidate", { offererId, answererId, candidate });
};
const handleGoodbye = async (id: string) => {
  logger.info("Handling goodbye", { id });
};
const handleAlias = async (id: string, alias: string, accepted: boolean) => {
  logger.debug("Handling alias", { id });

  if (accepted) {
    logger.info("Setting alias", { id, alias });

    aliases.set(alias, id);

    logger.debug("New aliases", { aliases: JSON.stringify([...aliases]) });
  } else {
    logger.info("Removing alias", { id, alias });

    aliases.delete(alias);

    logger.debug("New aliases", { aliases: JSON.stringify([...aliases]) });
  }
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
  handleAnswer,
  handleCandidate,
  handleGoodbye,
  handleAlias
);

client.open();
