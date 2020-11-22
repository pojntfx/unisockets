import * as Asyncify from "asyncify-wasm";
import fs from "fs";
import { WASI } from "wasi";
import { ExtendedRTCConfiguration } from "wrtc";
import yargs from "yargs";
import { ClientDoesNotExistError } from "../lib/signaling/errors/client-does-not-exist";
import { SignalingClient } from "../lib/signaling/services/signaling-client";
import { Sockets } from "../lib/sockets/sockets";
import { Transporter } from "../lib/transport/transporter";
import { getLogger } from "../lib/utils/logger";

const TEST_SUBNET = "10.0.0";
const TEST_ALIAS = `${TEST_SUBNET}.240:42069`;

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
const handleAcknowledgement = async (id: string, rejected: boolean) => {
  logger.debug("Handling acknowledgement", { id, rejected });

  if (!rejected) {
    if (testBind) {
      try {
        logger.info("Binding", { id, alias: TEST_ALIAS });

        await client.bind(TEST_ALIAS);

        logger.info("Bind accepted", { id, alias: TEST_ALIAS });

        try {
          while (true) {
            logger.info("Starting to accept", { id, alias: TEST_ALIAS });

            const clientAlias = await client.accept(TEST_ALIAS);

            const clientId = aliases.get(clientAlias);
            if (clientId === undefined) {
              throw new ClientDoesNotExistError();
            }

            (async () => {
              logger.info("Accepted", {
                id,
                alias: TEST_ALIAS,
                clientAlias,
                clientId,
              });

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
  } else {
    logger.error("Knock rejected", {
      id,
      remoteAlias: TEST_ALIAS,
    });
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
  TEST_SUBNET,
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

const handleExternalBind = async (alias: string) => {
  logger.info("Handling external bind", { alias });
};

const handleExternalAccept = async (alias: string) => {
  logger.info("Handling external accept", { alias });

  return `${TEST_SUBNET}.1:0`;
};

const handleExternalConnect = async (alias: string) => {
  logger.info("Handling external connect", { alias });
};

const handleExternalSend = async (alias: string, msg: Uint8Array) => {
  logger.info("Handling external send", { alias, msg });
};

const handleExternalRecv = async (alias: string) => {
  const msg = new TextEncoder().encode("Hello from client!");

  logger.info("Handling external rev", { alias, msg });

  return new Promise((res) =>
    setTimeout(() => res(msg), 1000)
  ) as Promise<Uint8Array>;
};

const sockets = new Sockets(
  handleExternalBind,
  handleExternalAccept,
  handleExternalConnect,
  handleExternalSend,
  handleExternalRecv
);

const wasi = new WASI();

(async () => {
  const { memoryId, imports } = await sockets.getImports();

  const instance = await Asyncify.instantiate(
    await WebAssembly.compile(
      testBind
        ? fs.readFileSync("./examples/echo_server.wasm")
        : fs.readFileSync("./examples/echo_client.wasm")
    ),
    {
      wasi_snapshot_preview1: wasi.wasiImport,
      env: imports,
    }
  );

  sockets.setMemory(memoryId, instance.exports.memory);

  wasi.start(instance);
})();

// client.open();
