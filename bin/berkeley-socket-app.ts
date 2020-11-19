import { ExtendedRTCConfiguration } from "wrtc";
import yargs from "yargs";
import { ClientDoesNotExistError } from "../lib/signaling/errors/client-does-not-exist";
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

const handleTransporterConnectionConnect = async (id: string) => {
  logger.info("Handling transporter connection connect", { id });
};
const handleTransporterConnectionDisconnect = async (id: string) => {
  logger.info("Handling transporter connection disconnect", { id });
};
const handleTransporterChannelOpen = async (id: string) => {
  logger.info("Handling transporter connection open", { id });
};
const handleTransporterChannelClose = async (id: string) => {
  logger.info("Handling transporter connection close", { id });
};

const aliases = new Map<string, string>();
const transporter = new Transporter(
  transporterConfig,
  handleTransporterConnectionConnect,
  handleTransporterConnectionDisconnect,
  handleTransporterChannelOpen,
  handleTransporterChannelClose
);

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
          logger.info("Starting to accept", { id, alias: TEST_ALIAS });

          const clientAlias = await client.accept(TEST_ALIAS);

          (async () => {
            const clientId = aliases.get(clientAlias);
            if (clientId === undefined) {
              throw new ClientDoesNotExistError();
            }

            logger.info("Accepted", {
              id,
              alias: TEST_ALIAS,
              clientAlias,
              clientId,
            });

            // TODO: Queue candidates until connections exists, add them to the connection, and remove the line below
            await new Promise((res) => setTimeout(() => res(), 1000));

            while (true) {
              await transporter.send(
                clientId,
                new TextEncoder().encode("Hello, client!")
              );

              await new Promise((res) => setTimeout(() => res(), 1000));
            }
          })();
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

      const serverId = aliases.get(TEST_ALIAS);
      if (serverId === undefined) {
        throw new ClientDoesNotExistError();
      }

      logger.info("Connect accepted", {
        id,
        remoteAlias: TEST_ALIAS,
        clientAlias,
      });

      while (true) {
        const msg = await transporter.recv(serverId);

        logger.info("Received", {
          id,
          remoteAlias: TEST_ALIAS,
          clientAlias,
          msg,
        });

        await new Promise((res) => setTimeout(() => res(), 1000));
      }
    } catch (e) {
      logger.error("Connect rejected", {
        id,
        remoteAlias: TEST_ALIAS,
        error: e,
      });

      try {
        await client.shutdown(TEST_ALIAS);

        logger.info("Shutdown accepted", {
          id,
          remoteAlias: TEST_ALIAS,
        });
      } catch (e) {
        logger.error("Shutdown rejected", {
          id,
          remoteAlias: TEST_ALIAS,
          error: e,
        });
      }
    }
  }
};
const getOffer = async (
  answererId: string,
  handleCandidate: (candidate: string) => Promise<any>
) => {
  const offer = await transporter.getOffer(answererId, handleCandidate);

  logger.info("Created offer", { answererId, offer });

  return offer;
};
const handleOffer = async (
  offererId: string,
  offer: string,
  handleCandidate: (candidate: string) => Promise<any>
) => {
  const answer = await transporter.handleOffer(
    offererId,
    offer,
    handleCandidate
  );

  logger.info("Created answer for offer", { offererId, offer, answer });

  return answer;
};
const handleAnswer = async (
  offererId: string,
  answererId: string,
  answer: string
) => {
  logger.info("Handling answer", { offererId, answererId, answer });

  await transporter.handleAnswer(answererId, answer);
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

  await transporter.shutdown(id);
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
  handleOffer,
  handleAnswer,
  handleCandidate,
  handleGoodbye,
  handleAlias
);

client.open();
