import NetworkConnection from "./network_connection.js";

export default class NetworkInterface {
  #config = {};
  #address = "";

  #connections = new Map();

  #onConnect = () => {};
  #onReceive = () => {};
  #onDisconnect = () => {};

  constructor(config, address, onConnect, onReceive, onDisconnect) {
    this.#config = config;
    this.#address = address;
    this.#onConnect = onConnect;
    this.#onReceive = onReceive;
    this.#onDisconnect = onDisconnect;
  }

  static Builder = class {
    #config = {};
    #address = "";

    #onConnect = () => {};
    #onReceive = () => {};
    #onDisconnect = () => {};

    setConfig(config) {
      this.#config = config;

      return this;
    }

    setAddress(address) {
      this.#address = address;

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
        this.#address,
        this.#onConnect,
        this.#onReceive,
        this.#onDisconnect
      );
    }
  };

  createConnection(id, onCandidate) {
    id = id || this.#address;

    this.#connections.set(
      id,
      new NetworkConnection.Builder()
        .setConfig(this.#config)
        .setOnConnect((...args) => this.#onConnect(id, ...args))
        .setOnCandidate((...args) => {
          onCandidate(id, ...args);
        })
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
