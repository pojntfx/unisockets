import DiscoveryClient from "../lib/discovery_client.js";
import NetworkInterface from "../lib/network_interface.js";
import EventEmitter from "events";

const ADDRESS = "ws://localhost:6999";

const candidateBus = new EventEmitter();
candidateBus.setMaxListeners(10000);

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

    connection.send("Hello!");
  })
  .setOnReceive((id, e) => {
    console.log(id, "received", e);
  })
  .setOnDisconnect((id, e) => {
    console.log(id, "disconnected", e);
  })
  .setOnCandidate((connectionId, candidate) => {
    candidateBus.emit("candidate", {
      connectionId,
      candidate,
    });

    console.log(connectionId, "candidate", candidate);
  })
  .build();

const discoveryClient = new DiscoveryClient.Builder()
  .setAddress(ADDRESS)
  .setGetOffer(async () => {
    const offerConnectionId = networkInterface.createConnection();
    const offerConnection = networkInterface.getConnectionById(
      offerConnectionId
    );
    const offer = await offerConnection.getOffer();

    console.log(`Offering ${offer}`);

    return { offer, offerConnectionId };
  })
  .setGetAnswer(async ({ offer, offerConnectionId }) => {
    const answerConnectionId = networkInterface.createConnection(
      offerConnectionId
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

candidateBus.on("candidate", (candidate) => {
  discoveryClient.sendCandidate({
    connectionId: candidate.connectionId,
    candidate: candidate.candidate,
  });
});

console.log(`Connecting to ${ADDRESS}`);

discoveryClient.connect();
