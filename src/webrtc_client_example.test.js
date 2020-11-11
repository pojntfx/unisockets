import fs from "fs";
import { WASI } from "wasi";
import BerkeleySocketManager from "../lib/berkeley_socket_manager.js";
import EventEmitter from "events";
import Asyncify from "asyncify-wasm";
import DiscoveryClient from "../lib/discovery_client.js";
import NetworkInterface from "../lib/network_interface.js";

const VIRTUAL_ADDRESS = "127.0.0.1:6912";
const REMOTE_ADDRESS = "ws://localhost:6999";

const senderConnection = new EventEmitter();
const receiverConnection = new EventEmitter();

const ready = new EventEmitter();

const networkInterface = new NetworkInterface.Builder()
  .setConfig({
    iceServers: [
      {
        url: "stun:global.stun.twilio.com:3478?transport=udp",
        urls: "stun:global.stun.twilio.com:3478?transport=udp",
      },
    ],
  })
  .setAddress(VIRTUAL_ADDRESS)
  .setOnConnect((id, e) => {
    console.log(id, "connected", e);

    const connection = networkInterface.getConnectionById(id);

    senderConnection.on(id, async (e) => {
      connection.send(e);
    });

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
  .setAddress(REMOTE_ADDRESS)
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

// Client (running async to that blocking operations like `fgets` work)
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
    .build();

  const instance = await Asyncify.instantiate(
    await WebAssembly.compile(fs.readFileSync("./src/client_example.wasm")),
    {
      wasi_snapshot_preview1: wasi.wasiImport,
      env: berkeleySocketManager.getImports(),
    }
  );

  berkeleySocketManager.setMemory(instance.exports.memory);

  wasi.start(instance);
});
