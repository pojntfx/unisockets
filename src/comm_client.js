import DiscoveryClient from "../lib/discovery_client.js";
import NetworkInterface from "../lib/network_interface.js";

const ADDRESS = "ws://localhost:6999";
const LOCAL_SID = Math.floor(Math.random() * 100000).toString();

const networkInterface = new NetworkInterface.Builder()
  .setConfig({
    iceServers: [
      {
        url: "stun:global.stun.twilio.com:3478?transport=udp",
        urls: "stun:global.stun.twilio.com:3478?transport=udp",
      },
    ],
  })
  .setOnConnect((id, e) => console.log(id, "connected", e))
  .setOnReceive((id, e) => console.log(id, "received", e))
  .setOnDisconnect((id, e) => console.log(id, "disconnected", e))
  .build();

// TODO: Add connection addressing system (create ID with offer and transfer ID through signaling server)

const discoveryClient = new DiscoveryClient.Builder()
  .setAddress(ADDRESS)
  .setGetOffer(async () => {
    const connectionId = networkInterface.createConnection();

    const connection = networkInterface.getConnectionById(connectionId);

    const offer = await connection.getOffer();

    console.log(`Offering ${offer}`);

    return offer;
  })
  .setGetAnswer(async (offer) => {
    console.log(`Answering ${offer}`);

    const connectionId = networkInterface.createConnection();

    const connection = networkInterface.getConnectionById(connectionId);

    const answer = await connection.getAnswer(offer);

    return answer;
  })
  .setOnAnswer((answer) => console.log(`Got answer ${answer}`))
  .build();

console.log(`Connecting to ${ADDRESS}`);

discoveryClient.connect();
