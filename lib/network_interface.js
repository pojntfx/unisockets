import NetworkConnection from "./network_connection.js";

export default class NetworkInterface {
  #config = {};
  #localAddress = "";

  #connections = new Map();
  #establishedConnections = new Map();

  #onConnect = () => {};
  #onReceive = () => {};
  #onDisconnect = () => {};

  constructor(config, localAddress, onConnect, onReceive, onDisconnect) {
    this.#config = config;
    this.#localAddress = localAddress;
    this.#onConnect = onConnect;
    this.#onReceive = onReceive;
    this.#onDisconnect = onDisconnect;
  }

  static Builder = class {
    #config = {};
    #localAddress = "";

    #onConnect = () => {};
    #onReceive = () => {};
    #onDisconnect = () => {};

    setConfig(config) {
      this.#config = config;

      return this;
    }

    setLocalAddress(localAddress) {
      this.#localAddress = localAddress;

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
        this.#localAddress,
        this.#onConnect,
        this.#onReceive,
        this.#onDisconnect
      );
    }
  };

  createConnection(id, onCandidate) {
    id = id || this.#localAddress;

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
        .setOnReceive((...args) => this.#onReceive(id, ...args))
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
