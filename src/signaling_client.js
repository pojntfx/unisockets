import WebSocket from "ws";

const ADDRESS = "ws://localhost:6999";

const ws = new WebSocket(ADDRESS);

ws.on("open", () => {
  console.log("Server connected");

  ws.send(`Hey server! It is: ${new Date()}`);
});

ws.on("message", (msg) => {
  console.log("received", msg);
});

ws.on("close", () => {
  console.log("Server disconnected");
});
