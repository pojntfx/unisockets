import NetworkConnection from "./network_connection.js";
import { v4 } from "uuid";

export default class NetworkInterface {
  #config = {};

  #connections = new Map();

  #onConnect = () => {};
  #onReceive = () => {};
  #onDisconnect = () => {};

  constructor(config, onConnect, onReceive, onDisconnect) {
    this.#config = config;
    this.#onConnect = onConnect;
    this.#onReceive = onReceive;
    this.#onDisconnect = onDisconnect;
  }

  static Builder = class {
    #config = {};

    #onConnect = () => {};
    #onReceive = () => {};
    #onDisconnect = () => {};

    setConfig(config) {
      this.#config = config;

      return this;
    }

    setOnConnect(handler) {
      this.#onConnect = handler;

      return this;
    }

    setOnReceive(handler) {
      this.#onReceive = handler;

      return this;
    }

    setOnDisconnect(handler) {
      this.#onDisconnect = handler;

      return this;
    }

    build() {
      return new NetworkInterface(
        this.#config,
        this.#onConnect,
        this.#onReceive,
        this.#onDisconnect
      );
    }
  };

  createConnection() {
    const id = v4();

    this.#connections.set(
      id,
      new NetworkConnection.Builder()
        .setConfig(this.#config)
        .setOnConnect((...args) => this.#onConnect(id, ...args))
        .setOnReceive((...args) => this.#onReceive(id, ...args))
        .setOnDisconnect((...args) => this.#onDisconnect(id, ...args))
        .build()
    );

    return id;
  }

  getConnectionById(id) {
    return this.#connections.get(id);
  }
}
