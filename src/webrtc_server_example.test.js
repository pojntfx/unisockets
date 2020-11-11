import fs from "fs";
import { WASI } from "wasi";
import BerkeleySocketManager from "../lib/berkeley_socket_manager.js";
import EventEmitter, { once } from "events";
import Asyncify from "asyncify-wasm";
import DiscoveryClient from "../lib/discovery_client.js";
import NetworkInterface from "../lib/network_interface.js";

const LOCAL_ADDRESS = "10.0.0.2:6912";
const SIGNALING_ADDRESS = "ws://localhost:6999";

const senderConnection = new EventEmitter();
const receiverConnection = new EventEmitter();

const ready = new EventEmitter();
const accept = new EventEmitter();

const networkInterface = new NetworkInterface.Builder()
  .setConfig({
    iceServers: [
      {
        url: "stun:global.stun.twilio.com:3478?transport=udp",
        urls: "stun:global.stun.twilio.com:3478?transport=udp",
      },
    ],
  })
  .setLocalAddress(LOCAL_ADDRESS)
  .setOnConnect((id, e) => {
    console.log(id, "connected", e);

    const connection = networkInterface.getConnectionById(id);

    senderConnection.on(id, async (e) => {
      connection.send(e);
    });

    (async () => {
      await once(ready, "isReady");

      accept.emit("connected", id);
    })();

    ready.emit("ready", true);
  })
  .setOnReceive((id, e) => {
    console.log(id, "received", e);

    receiverConnection.emit(id, e);
  })
  .setOnDisconnect((id, e) => {
    console.log(id, "disconnected", e);
  })
  .build();

const discoveryClient = new DiscoveryClient.Builder()
  .setAddress(SIGNALING_ADDRESS)
  .setGetOffer(async (handler) => {
    const offerConnectionId = networkInterface.createConnection(null, handler);
    const offerConnection = networkInterface.getConnectionById(
      offerConnectionId
    );
    const offer = await offerConnection.getOffer();

    console.log(`Offering ${offer}`);

    return { offer, offerConnectionId };
  })
  .setGetAnswer(async ({ offer, offerConnectionId, handler }) => {
    const answerConnectionId = networkInterface.createConnection(
      offerConnectionId,
      handler
    );
    const answerConnection = networkInterface.getConnectionById(
      answerConnectionId
    );
    const answer = await answerConnection.getAnswer(offer);

    console.log(`Answering ${answer}`);

    return answer;
  })
  .setOnAnswer(({ offerConnectionId, answer }) => {
    console.log(`Got answer ${answer}`);

    const offerConnection = networkInterface.getConnectionById(
      offerConnectionId
    );

    offerConnection.acceptAnswer(answer);
  })
  .setOnCandidate(({ connectionId, candidate }) => {
    console.log(`Got candidate ${candidate}`);

    const connection = networkInterface.getConnectionById(connectionId);

    connection && connection.acceptCandidate(candidate);
  })
  .build();

// Discovery client
(async () => discoveryClient.connect())();

// Server
ready.once("ready", async () => {
  const wasi = new WASI();
  const berkeleySocketManager = new BerkeleySocketManager.Builder()
    .setGetConnection(async (_, port, addr) => {
      return {
        send: async (message) => {
          await senderConnection.emit(`${addr}:${port}`, message);
        },
      };
    })
    .setGetReceiver(async (_, port, addr) => {
      const receiverBroadcaster = new EventEmitter();

      receiverConnection.on(
        `${addr}:${port}`,
        async (message) =>
          await receiverBroadcaster.emit(
            "message",
            new Uint8Array(message.data)
          )
      );

      return receiverBroadcaster;
    })
    .setGetAccepter(async () => {
      const accepterBroadcaster = new EventEmitter();

      accept.on(
        "connected",
        async (peer) => await accepterBroadcaster.emit("connected", peer)
      );

      return accepterBroadcaster;
    })
    .setOnListen(() => () => ready.emit("isReady", true))
    .build();

  const instance = await Asyncify.instantiate(
    await WebAssembly.compile(fs.readFileSync("./src/server_example.wasm")),
    {
      wasi_snapshot_preview1: wasi.wasiImport,
      env: berkeleySocketManager.getImports(),
    }
  );

  berkeleySocketManager.setMemory(instance.exports.memory);

  wasi.start(instance);
});
