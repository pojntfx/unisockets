import { v1 } from "uuid";
import yargs from "yargs";
import { SignalingClient } from "../lib/signaling/services/signaling-client";

const getOffer = async () => v1();

const { raddr, reconnectDuration } = yargs(process.argv.slice(2)).options({
  raddr: {
    description: "Remote address",
    default: "ws://localhost:6999",
  },
  reconnectDuration: {
    description: "Reconnect duration in milliseconds",
    default: 1000,
  },
}).argv;

const client = new SignalingClient(raddr, reconnectDuration, getOffer);

client.open();
