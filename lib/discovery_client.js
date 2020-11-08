import EventEmitter from "events";
import WebSocket from "ws";

import {
  DISCOVERY_OPCODE_OFFER,
  DISCOVERY_OPCODE_ANSWER,
  DISCOVERY_OPCODE_CANDIDATE,
} from "./discovery_server.js";

export default class DiscoveryClient {
  #address = "";

  #broadcaster = undefined;
  #client = undefined;

  #onAnswer = () => {};
  #getAnswer = () => {};
  #getOffer = () => {};
  #onCandidate = () => {};

  #localSDPs = [];

  constructor(address, onAnswer, getAnswer, getOffer, onCandidate) {
    this.#address = address;
    this.#onAnswer = onAnswer;
    this.#getAnswer = getAnswer;
    this.#getOffer = getOffer;
    this.#onCandidate = onCandidate;
  }

  static Builder = class {
    #address = "";

    #onAnswer = () => {};
    #getAnswer = () => {};
    #getOffer = () => {};
    #onCandidate = () => {};

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

    setOnCandidate(handler) {
      this.#onCandidate = handler;

      return this;
    }

    build() {
      return new DiscoveryClient(
        this.#address,
        this.#onAnswer,
        this.#getAnswer,
        this.#getOffer,
        this.#onCandidate
      );
    }
  };

  connect() {
    this.#broadcaster = new EventEmitter();
    this.#broadcaster.setMaxListeners(10000);
    this.#client = new WebSocket(this.#address);

    this.#client.on("open", async () => {
      this.#broadcaster.on("offer", async ({ offer, offerConnectionId }) => {
        const answer = await this.#getAnswer({
          offer,
          offerConnectionId,
        });

        this.#localSDPs.push(answer);

        this.#client.send(
          JSON.stringify({
            opcode: DISCOVERY_OPCODE_ANSWER,
            data: {
              offer,
              offerConnectionId,
              answer,
            },
          })
        );
      });

      this.#broadcaster.on("answer", (data) => this.#onAnswer(data));

      this.#broadcaster.on("candidate", (data) => this.#onCandidate(data));

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
              });
            }

            break;
          }
          case DISCOVERY_OPCODE_CANDIDATE: {
            this.#broadcaster.emit("candidate", {
              connectionId: req.data.connectionId,
              candidate: req.data.candidate,
            });

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

  // TODO: Do this automatically after getting the offer (return the connection as well and listen there)
  sendCandidate(candidate) {
    this.#client.send(
      JSON.stringify({
        opcode: DISCOVERY_OPCODE_CANDIDATE,
        data: {
          connectionId: candidate.connectionId,
          candidate: candidate.candidate,
        },
      })
    );
  }
}
