import WebSocket from "ws";

const PORT = 6999;

const wss = new WebSocket.Server({
  port: PORT,
});

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (msg) => {
    console.log("received", msg);

    ws.send(`Hey client! It is: ${new Date()}`);
  });
});
