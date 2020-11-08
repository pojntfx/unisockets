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

  #localSDPs = [];

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
    this.#broadcaster.setMaxListeners(10000);
    this.#client = new WebSocket(this.#address);

    this.#client.on("open", async () => {
      this.#broadcaster.on("offer", async ({ offer, offerConnectionId }) => {
        const { answer, answerConnectionId } = await this.#getAnswer(offer);

        this.#localSDPs.push(answer);

        this.#client.send(
          JSON.stringify({
            opcode: DISCOVERY_OPCODE_ANSWER,
            data: {
              offer,
              offerConnectionId,
              answer,
              answerConnectionId,
            },
          })
        );
      });

      this.#broadcaster.on("answer", (data) => this.#onAnswer(data));

      this.#client.on("message", (msg) => {
        const req = JSON.parse(msg);

        switch (req.opcode) {
          case DISCOVERY_OPCODE_OFFER: {
            // Ignore own offer
            if (!this.#localSDPs.includes(req.data.offer)) {
              this.#broadcaster.emit("offer", {
                offer: req.data.offer,
                offerConnectionId: req.data.offerConnectionId,
              });
            }

            break;
          }
          case DISCOVERY_OPCODE_ANSWER: {
            // Don't answer our own answers
            if (!this.#localSDPs.includes(req.data.answer)) {
              this.#broadcaster.emit("answer", {
                offer: req.data.offer,
                offerConnectionId: req.data.offerConnectionId,
                answer: req.data.answer,
                answerConnectionId: req.data.answerConnectionId,
              });
            }

            break;
          }
        }
      });

      const { offer, offerConnectionId } = await this.#getOffer();

      this.#localSDPs.push(offer);

      this.#client.send(
        JSON.stringify({
          opcode: DISCOVERY_OPCODE_OFFER,
          data: {
            offer,
            offerConnectionId,
          },
        })
      );
    });
  }
}
