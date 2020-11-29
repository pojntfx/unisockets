import yargs from "yargs";
import { SignalingServer } from "../lib/signaling/services/signaling-server";

const { listenAddress } = yargs(process.argv.slice(2)).options({
  listenAddress: {
    description: "Listen address",
    default: "0.0.0.0:6999",
  },
}).argv;

const server = new SignalingServer(
  listenAddress.split(":")[0],
  parseInt(listenAddress.split(":")[1])
);

server.open();
