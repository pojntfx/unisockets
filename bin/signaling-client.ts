import yargs from "yargs";
import { SignalingClient } from "../lib/signaling/services/signaling-client";

const { raddr } = yargs(process.argv.slice(2)).options({
  raddr: {
    description: "Remote address",
    default: "ws://localhost:6999",
  },
}).argv;

const client = new SignalingClient(raddr);

client.open();
