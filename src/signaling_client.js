import EventEmitter from "events";
import WebSocket from "ws";

const ADDRESS = "ws://localhost:6999";

const OFFER_OPCODE = "offer";
const ANSWER_OPCODE = "answer";

const LOCAL_SID = Math.floor(Math.random() * 100000).toString();

const broadcaster = new EventEmitter();
const client = new WebSocket(ADDRESS);

client.on("open", () => {
  console.log(`Connected to server ${ADDRESS}`);

  broadcaster.on("offer", (sids) => {
    console.log("Sending answer");

    client.send(
      JSON.stringify({
        opcode: ANSWER_OPCODE,
        sids: {
          offer: sids.offer,
          answer: LOCAL_SID,
        },
      })
    );
  });

  broadcaster.on("answer", (sids) => {
    console.log("Connecting to", sids.answer);
  });

  client.on("message", (msg) => {
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

        if (req.sids.offer !== LOCAL_SID && req.sids.answer !== LOCAL_SID) {
          broadcaster.emit("answer", {
            answer: req.sids.answer,
          });
        }

        break;
      }
    }
  });

  setInterval(() => {
    console.log("Sending offer");

    client.send(
      JSON.stringify({
        opcode: OFFER_OPCODE,
        sids: {
          offer: LOCAL_SID,
        },
      })
    );
  }, 2500);
});
