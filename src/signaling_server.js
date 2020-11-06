import EventEmitter from "events";
import WebSocket from "ws";

const PORT = 6999;

const OFFER_OPCODE = "offer";
const ANSWER_OPCODE = "answer";

const broadcaster = new EventEmitter();
const server = new WebSocket.Server({
  port: PORT,
});

server.on("connection", (connection) => {
  console.log("Client connected");

  broadcaster.on("offer", (sids) => {
    console.log("Broadcasting offer");

    connection.send(
      JSON.stringify({
        opcode: OFFER_OPCODE,
        sids: {
          offer: sids.offer,
        },
      })
    );
  });

  broadcaster.on("answer", (sids) => {
    console.log("Broadcasting answer");

    connection.send(
      JSON.stringify({
        opcode: ANSWER_OPCODE,
        sids: {
          offer: sids.offer,
          answer: sids.answer,
        },
      })
    );
  });

  connection.on("message", (msg) => {
    const req = JSON.parse(msg);

    switch (req.opcode) {
      case OFFER_OPCODE: {
        console.log("Received offer");

        broadcaster.emit("offer", {
          offer: req.sids.offer,
        });

        break;
      }
      case ANSWER_OPCODE: {
        console.log("Received answer");

        broadcaster.emit("answer", {
          offer: req.sids.offer,
          answer: req.sids.answer,
        });

        break;
      }
    }
  });
});

console.log(`Listening on port ${PORT}`);
