import DiscoveryClient from "../lib/discovery_client.js";
import NetworkInterface from "../lib/network_interface.js";
import { v4 } from "uuid";

const ADDRESS = "ws://localhost:6999";
const MESSAGE = `Hello peer! My message seed: ${v4()}`;

console.log("Sending the following message to peers:", MESSAGE);

const networkInterface = new NetworkInterface.Builder()
  .setConfig({
    iceServers: [
      {
        url: "stun:global.stun.twilio.com:3478?transport=udp",
        urls: "stun:global.stun.twilio.com:3478?transport=udp",
      },
    ],
  })
  .setOnConnect((id, e) => {
    console.log(id, "connected", e);

    const connection = networkInterface.getConnectionById(id);

    connection.send(MESSAGE);
  })
  .setOnReceive((id, e) => {
    console.log(id, "received", e);
  })
  .setOnDisconnect((id, e) => {
    console.log(id, "disconnected", e);
  })
  .build();

const discoveryClient = new DiscoveryClient.Builder()
  .setAddress(ADDRESS)
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

console.log(`Connecting to ${ADDRESS}`);

discoveryClient.connect();
