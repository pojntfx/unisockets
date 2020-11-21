import yargs from "yargs";
import { SignalingServer } from "../lib/signaling/services/signaling-server";

const { laddr } = yargs(process.argv.slice(2)).options({
  laddr: {
    description: "Listen address",
    default: "0.0.0.0:6999",
  },
}).argv;

const server = new SignalingServer(
  laddr.split(":")[0],
  parseInt(laddr.split(":")[1])
);

server.open();
