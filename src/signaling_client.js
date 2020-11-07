import DiscoveryClient from "../lib/discovery_client.js";

const ADDRESS = "ws://localhost:6999";
const LOCAL_SID = Math.floor(Math.random() * 100000).toString();

const discoveryClient = new DiscoveryClient.Builder()
  .setAddress(ADDRESS)
  .setGetOffer(() => LOCAL_SID)
  .setGetAnswer((offer) => {
    console.log(`Answering ${offer}`);

    return LOCAL_SID;
  })
  .setOnAnswer((answer) => console.log(`Got answer ${answer}`))
  .build();

console.log(`Connecting to ${ADDRESS}`);

discoveryClient.connect();
