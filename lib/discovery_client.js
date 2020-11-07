import EventEmitter from "events";
import WebSocket from "ws";

import {
  DISCOVERY_OPCODE_OFFER,
  DISCOVERY_OPCODE_ANSWER,
} from "./discovery_server.js";

export default class DiscoveryClient {
  #address = "";

  #broadcaster = undefined;
  #client = undefined;

  #onAnswer = () => {};
  #getAnswer = () => {};
  #getOffer = () => {};

  #localSids = [];

  constructor(address, onAnswer, getAnswer, getOffer) {
    this.#address = address;
    this.#onAnswer = onAnswer;
    this.#getAnswer = getAnswer;
    this.#getOffer = getOffer;
  }

  static Builder = class {
    #address = "";

    #onAnswer = () => {};
    #getAnswer = () => {};
    #getOffer = () => {};

    setAddress(address) {
      this.#address = address;

      return this;
    }

    setOnAnswer(handler) {
      this.#onAnswer = handler;

      return this;
    }

    setGetAnswer(handler) {
      this.#getAnswer = handler;

      return this;
    }

    setGetOffer(handler) {
      this.#getOffer = handler;

      return this;
    }

    build() {
      return new DiscoveryClient(
        this.#address,
        this.#onAnswer,
        this.#getAnswer,
        this.#getOffer
      );
    }
  };

  connect() {
    this.#broadcaster = new EventEmitter();
    this.#client = new WebSocket(this.#address);

    this.#client.on("open", async () => {
      this.#broadcaster.on("offer", (sids) => {
        const answer = this.#getAnswer(sids.offer);

        this.#localSids.push(answer);

        this.#client.send(
          JSON.stringify({
            opcode: DISCOVERY_OPCODE_ANSWER,
            sids: {
              offer: sids.offer,
              answer,
            },
          })
        );
      });

      this.#broadcaster.on("answer", (sids) => this.#onAnswer(sids.answer));

      this.#client.on("message", (msg) => {
        const req = JSON.parse(msg);

        switch (req.opcode) {
          case DISCOVERY_OPCODE_OFFER: {
            // Ignore own offer
            if (!this.#localSids.includes(req.sids.offer)) {
              this.#broadcaster.emit("offer", {
                offer: req.sids.offer,
              });
            }

            break;
          }
          case DISCOVERY_OPCODE_ANSWER: {
            // Don't answer our own answers
            if (!this.#localSids.includes(req.sids.answer)) {
              this.#broadcaster.emit("answer", {
                answer: req.sids.answer,
              });
            }

            break;
          }
        }
      });

      const offer = await this.#getOffer();

      this.#localSids.push(offer);

      this.#client.send(
        JSON.stringify({
          opcode: DISCOVERY_OPCODE_OFFER,
          sids: {
            offer,
          },
        })
      );
    });
  }
}
