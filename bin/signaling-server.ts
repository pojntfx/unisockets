import { Server } from "ws";
import yargs from "yargs";

const { laddr } = yargs(process.argv.slice(2)).options({
  laddr: {
    default: "0.0.0.0:6999",
  },
}).argv;

const server = new Server({
  host: laddr.split(":")[0],
  port: parseInt(laddr.split(":")[1]),
});

server.on("connection", (connection) => {
  connection.send("Welcome, client!");

  connection.on("message", (message) => {
    connection.send(`You've sent: ${message}`);
  });
});
