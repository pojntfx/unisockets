import NetworkConnection from "./network_connection.js";

export default class NetworkInterface {
  #config = {};
  #getLocalAddress = "";

  #connections = new Map();
  #establishedConnections = new Map();

  #onConnect = () => {};
  #onReceive = () => {};
  #onDisconnect = () => {};

  constructor(config, getLocalAddress, onConnect, onReceive, onDisconnect) {
    this.#config = config;
    this.#getLocalAddress = getLocalAddress;
    this.#onConnect = onConnect;
    this.#onReceive = onReceive;
    this.#onDisconnect = onDisconnect;
  }

  static Builder = class {
    #config = {};
    #getLocalAddress = "";

    #onConnect = () => {};
    #onReceive = () => {};
    #onDisconnect = () => {};

    setConfig(config) {
      this.#config = config;

      return this;
    }

    setGetLocalAddress(handler) {
      this.#getLocalAddress = handler;

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
        this.#getLocalAddress,
        this.#onConnect,
        this.#onReceive,
        this.#onDisconnect
      );
    }
  };

  createConnection(id, onCandidate) {
    id = id || this.#getLocalAddress();

    this.#connections.set(
      id,
      new NetworkConnection.Builder()
        .setConfig(this.#config)
        .setOnConnect((...args) =>
          this.#onConnect(id, this.getEstablishedConnections(id), ...args)
        )
        .setOnCandidate((...args) => {
          onCandidate(id, ...args);
        })
        .setOnReceive((...args) =>
          this.#onReceive(id, this.getEstablishedConnections(id), ...args)
        )
        .setOnDisconnect((...args) => this.#onDisconnect(id, ...args))
        .build()
    );

    return id;
  }

  getConnectionById(id) {
    return this.#connections.get(id);
  }

  establish(parentConnectionId, childConnectionId) {
    this.#establishedConnections.set(parentConnectionId, [
      ...(this.#establishedConnections.get(parentConnectionId) || []),
      childConnectionId,
    ]);

    // TODO: Remove the established connection after disconnect
  }

  getEstablishedConnections(parentConnectionId) {
    return this.#establishedConnections.get(parentConnectionId) || [];
  }
}
