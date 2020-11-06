import DiscoveryClient from "../lib/discovery.js";

const ADDRESS = "ws://localhost:6999";

const LOCAL_SID = Math.floor(Math.random() * 100000).toString();

const discovery = new DiscoveryClient.Builder()
  .setAddress(ADDRESS)
  .setGetOffer(() => LOCAL_SID)
  .setGetAnswer((offer) => {
    console.log(`Answering ${offer}`);

    return LOCAL_SID;
  })
  .setOnAnswer((answer) => console.log(`Got answer ${answer}`))
  .build();

discovery.connect();
