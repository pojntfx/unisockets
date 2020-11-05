import EventEmitter from "events";
import WebSocket from "ws";

const PORT = 6999;
const ANSWER = "answer";
const OFFER = "offer";

const broadcaster = new EventEmitter();
const server = new WebSocket.Server({
  port: PORT,
});

server.on("connection", (connection) => {
  console.log("Client connected");

  broadcaster.on("offer", (sid) => {
    console.log("Sending offer");

    connection.send(
      JSON.stringify({
        opcode: OFFER,
        sid: sid,
      })
    );
  });

  broadcaster.on("answer", (sid) => {
    console.log("Sending answer");

    connection.send(
      JSON.stringify({
        opcode: ANSWER,
        sid: sid,
      })
    );
  });

  connection.on("message", (msg) => {
    const req = JSON.parse(msg);

    switch (req.opcode) {
      case OFFER: {
        console.log("Received offer");

        broadcaster.emit("offer", req.sid);

        break;
      }
      case ANSWER: {
        console.log("Received answer");

        broadcaster.emit("answer", req.sid);

        break;
      }
    }
  });
});

console.log(`Listening on port ${PORT}`);
