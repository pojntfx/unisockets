import DiscoveryClient from "../lib/discovery_client.js";
import NetworkInterface from "../lib/network_interface.js";
import { v4 } from "uuid";

const VIRTUAL_ADDRESS = `${v4()}:42069`;
const REMOTE_ADDRESS = "ws://localhost:6999";
const MESSAGE = `Hello peer from ${VIRTUAL_ADDRESS}`;

const networkInterface = new NetworkInterface.Builder()
  .setConfig({
    iceServers: [
      {
        url: "stun:global.stun.twilio.com:3478?transport=udp",
        urls: "stun:global.stun.twilio.com:3478?transport=udp",
      },
      {
        url: "turn:global.turn.twilio.com:3478?transport=udp",
        username:
          "cd4dfc8127082a04b865f5607c031410726df919c4ced0f93619be0ed2b811b3",
        urls: "turn:global.turn.twilio.com:3478?transport=udp",
        credential: "h/sD5UftD1H2Tjlux/u6kqdqsIleXtEEZthVgY/BciA=",
      },
      {
        url: "turn:global.turn.twilio.com:3478?transport=tcp",
        username:
          "cd4dfc8127082a04b865f5607c031410726df919c4ced0f93619be0ed2b811b3",
        urls: "turn:global.turn.twilio.com:3478?transport=tcp",
        credential: "h/sD5UftD1H2Tjlux/u6kqdqsIleXtEEZthVgY/BciA=",
      },
      {
        url: "turn:global.turn.twilio.com:443?transport=tcp",
        username:
          "cd4dfc8127082a04b865f5607c031410726df919c4ced0f93619be0ed2b811b3",
        urls: "turn:global.turn.twilio.com:443?transport=tcp",
        credential: "h/sD5UftD1H2Tjlux/u6kqdqsIleXtEEZthVgY/BciA=",
      },
    ],
  })
  .setAddress(VIRTUAL_ADDRESS)
  .setOnConnect((id, e) => {
    console.log(id, "connected", e);

    const connection = networkInterface.getConnectionById(id);

    setInterval(
      () => connection.send(`${MESSAGE}, it is now: ${Date.now()}`),
      1000
    );
  })
  .setOnReceive((id, e) => {
    console.log(id, "received", e);
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

console.log(`Connecting to ${REMOTE_ADDRESS} as ${VIRTUAL_ADDRESS}`);

discoveryClient.connect();
