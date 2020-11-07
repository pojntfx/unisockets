export default class NetworkConnection {
  #config = {};

  #connection = undefined;
  #channel = undefined;

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
      return new NetworkConnection(
        this.#config,
        this.#onConnect,
        this.#onReceive,
        this.#onDisconnect
      );
    }
  };

  async getOffer() {
    return new Promise(async (res) => {
      this.#connection = new RTCPeerConnection(this.#config);
      this.#connection.onicecandidate = async (e) => {
        e.candidate || res(this.#connection.localDescription);
      };

      this.#channel = this.#connection.createDataChannel("channel");
      this.#channel.onopen = this.#onConnect;
      this.#channel.onmessage = this.#onReceive;
      this.#channel.onclose = this.#onDisconnect;

      const offer = await this.#connection.createOffer();
      this.#connection.setLocalDescription(offer);
    });
  }

  async getAnswer(offer) {
    return new Promise(async (res) => {
      this.#connection = new RTCPeerConnection(this.#config);
      this.#connection.onicecandidate = async (e) => {
        e.candidate || res(this.#connection.localDescription);
      };

      this.#connection.setRemoteDescription(offer);
      this.#connection.ondatachannel = async (channel) => {
        channel.channel.onopen = this.#onConnect;
        channel.channel.onmessage = this.#onReceive;
        channel.channel.onclose = this.#onDisconnect;

        this.#channel = channel.channel;
      };

      const answer = await this.#connection.createAnswer();
      this.#connection.setLocalDescription(answer);
    });
  }

  async acceptAnswer(answer) {
    this.#connection.setRemoteDescription(answer);
  }

  async send(message) {
    await this.#channel.send(message);
  }
}
