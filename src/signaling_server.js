import DiscoveryServer from "../lib/discovery_server.js";

const HOST = "localhost";
const PORT = 6999;

const discoveryServer = new DiscoveryServer.Builder()
  .setHost(HOST)
  .setPort(PORT)
  .build();

console.log(`Listening on ${HOST}:${PORT}`);

discoveryServer.listen();
