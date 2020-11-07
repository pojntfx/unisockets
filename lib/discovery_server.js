import EventEmitter from "events";
import WebSocket from "ws";

export const DISCOVERY_OPCODE_OFFER = "offer";
export const DISCOVERY_OPCODE_ANSWER = "answer";

export default class DiscoveryServer {
  #host = "localhost";
  #port = 6999;

  #broadcaster = undefined;
  #server = undefined;

  constructor(host, port) {
    this.#host = host;
    this.#port = port;
  }

  static Builder = class {
    #host = "localhost";
    #port = 6999;

    setHost(host) {
      this.#host = host;

      return this;
    }

    setPort(port) {
      this.#port = port;

      return this;
    }

    build() {
      return new DiscoveryServer(this.#host, this.#port);
    }
  };

  listen() {
    this.#broadcaster = new EventEmitter();
    this.#server = new WebSocket.Server({
      host: this.#host,
      port: this.#port,
    });

    this.#server.on("connection", (connection) => {
      this.#broadcaster.on("offer", (sids) =>
        connection.send(
          JSON.stringify({
            opcode: DISCOVERY_OPCODE_OFFER,
            sids: {
              offer: sids.offer,
            },
          })
        )
      );

      this.#broadcaster.on("answer", (sids) =>
        connection.send(
          JSON.stringify({
            opcode: DISCOVERY_OPCODE_ANSWER,
            sids: {
              offer: sids.offer,
              answer: sids.answer,
            },
          })
        )
      );

      connection.on("message", (msg) => {
        const req = JSON.parse(msg);

        switch (req.opcode) {
          case DISCOVERY_OPCODE_OFFER: {
            this.#broadcaster.emit("offer", {
              offer: req.sids.offer,
            });

            break;
          }
          case DISCOVERY_OPCODE_ANSWER: {
            this.#broadcaster.emit("answer", {
              offer: req.sids.offer,
              answer: req.sids.answer,
            });

            break;
          }
        }
      });
    });
  }
}
