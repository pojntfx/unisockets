import { ExtendedRTCConfiguration } from "wrtc";
import yargs from "yargs";
import { SignalingClient } from "../lib/signaling/services/signaling-client";
import { Transporter } from "../lib/transport/transporter";
import { getLogger } from "../lib/utils/logger";

const TEST_ALIAS = "bind-testing.com";
const transporterConfig: ExtendedRTCConfiguration = {
  iceServers: [
    {
      urls: "stun:global.stun.twilio.com:3478?transport=udp",
    },
  ],
};

const { raddr, reconnectDuration, testBind } = yargs(
  process.argv.slice(2)
).options({
  raddr: {
    description: "Remote address",
    default: "ws://localhost:6999",
  },
  reconnectDuration: {
    description: "Reconnect duration in milliseconds",
    default: 1000,
  },
  testBind: {
    description: `Bind to ${TEST_ALIAS} alias for testing purposes; all clients will try to connect to this test alias`,
    default: false,
  },
}).argv;

const logger = getLogger();

const aliases = new Map<string, string>();
const transporter = new Transporter(transporterConfig);

const handleConnect = async () => {
  logger.info("Handling connect");
};
const handleDisconnect = async () => {
  logger.info("Handling disconnect");
};
const handleAcknowledgement = async (id: string) => {
  logger.debug("Handling acknowledgement", { id });

  if (testBind) {
    try {
      logger.info("Binding", { id, alias: TEST_ALIAS });

      await client.bind(TEST_ALIAS);

      logger.info("Bind accepted", { id, alias: TEST_ALIAS });

      try {
        while (true) {
          logger.info("Starting Accepting", { id, alias: TEST_ALIAS });

          const clientAlias = await client.accept(TEST_ALIAS);
          const clientId = aliases.get(clientAlias);

          logger.info("Accepted", {
            id,
            alias: TEST_ALIAS,
            clientAlias,
            clientId,
          });
        }
      } catch (e) {
        logger.error("Accept rejected", { id, alias: TEST_ALIAS, error: e });

        try {
          await client.shutdown(TEST_ALIAS);

          logger.info("Shutdown accepted", { id, alias: TEST_ALIAS });
        } catch (e) {
          logger.error("Shutdown rejected", {
            id,
            alias: TEST_ALIAS,
            error: e,
          });
        }
      }
    } catch (e) {
      logger.error("Bind rejected", { id, alias: TEST_ALIAS, error: e });
    }
  } else {
    try {
      logger.info("Connecting", { id, remoteAlias: TEST_ALIAS });

      const clientAlias = await client.connect(TEST_ALIAS);

      logger.info("Connect accepted", {
        id,
        remoteAlias: TEST_ALIAS,
        clientAlias,
      });

      try {
        await client.shutdown(clientAlias);

        logger.info("Shutdown accepted", {
          id,
          remoteAlias: TEST_ALIAS,
          clientAlias,
        });
      } catch (e) {
        logger.error("Shutdown rejected", {
          id,
          remoteAlias: TEST_ALIAS,
          clientAlias,
          error: e,
        });
      }
    } catch (e) {
      logger.error("Connect rejected", {
        id,
        remoteAlias: TEST_ALIAS,
        error: e,
      });
    }
  }
};
const getOffer = async (id: string) => {
  const offer = await transporter.getOffer();

  logger.info("Getting offer", { id, offer });

  return offer;
};
const getAnswer = async (
  offererId: string,
  offer: string,
  handleCandidate: (candidate: string) => Promise<any>
) => {
  const answer = await transporter.handleOffer(
    offererId,
    offer,
    handleCandidate
  );

  logger.info("Getting answer for offer", { offererId, offer, answer });

  return answer;
};
const handleAnswer = async (
  offererId: string,
  answererId: string,
  answer: string,
  handleCandidate: (candidate: string) => Promise<any>
) => {
  logger.info("Handling answer", { offererId, answererId, answer });

  await transporter.handleAnswer(answererId, answer, handleCandidate);
};
const handleCandidate = async (
  offererId: string,
  answererId: string,
  candidate: string
) => {
  logger.info("Handling candidate", { offererId, answererId, candidate });

  await transporter.handleCandidate(offererId, candidate);
};
const handleGoodbye = async (id: string) => {
  logger.info("Handling goodbye", { id });
};
const handleAlias = async (id: string, alias: string, set: boolean) => {
  logger.debug("Handling alias", { id });

  if (set) {
    logger.info("Setting alias", { id, alias });

    aliases.set(alias, id);

    logger.debug("New aliases", {
      aliases: JSON.stringify(Array.from(aliases)),
    });
  } else {
    logger.info("Removing alias", { id, alias });

    aliases.delete(alias);

    logger.debug("New aliases", {
      aliases: JSON.stringify(Array.from(aliases)),
    });
  }
};

const client = new SignalingClient(
  raddr,
  reconnectDuration,
  handleConnect,
  handleDisconnect,
  handleAcknowledgement,
  getOffer,
  getAnswer,
  handleAnswer,
  handleCandidate,
  handleGoodbye,
  handleAlias
);

client.open();
