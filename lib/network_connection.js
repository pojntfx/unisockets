import wrtc from "wrtc";
const { RTCPeerConnection, RTCSessionDescription } = wrtc;

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
    this.#connection = new RTCPeerConnection(this.#config);

    this.#channel = this.#connection.createDataChannel("channel");
    this.#channel.onopen = this.#onConnect;
    this.#channel.onmessage = this.#onReceive;
    this.#channel.onclose = this.#onDisconnect;

    const offer = await this.#connection.createOffer();
    this.#connection.setLocalDescription(offer);

    return this.#connection.localDescription.sdp; // TODO: Get this to work in browser
  }

  async getAnswer(offer) {
    this.#connection = new RTCPeerConnection(this.#config);

    this.#connection.setRemoteDescription(
      new RTCSessionDescription({
        type: "offer",
        sdp: offer,
      })
    );
    this.#connection.ondatachannel = async (channel) => {
      channel.channel.onopen = this.#onConnect;
      channel.channel.onmessage = this.#onReceive;
      channel.channel.onclose = this.#onDisconnect;

      this.#channel = channel.channel;
    };

    const answer = await this.#connection.createAnswer();
    this.#connection.setLocalDescription(answer);

    return this.#connection.localDescription.sdp; // TODO: Get this to work in browser
  }

  async acceptAnswer(answer) {
    this.#connection.setRemoteDescription(
      new RTCSessionDescription({
        type: "answer",
        sdp: answer,
      })
    );
  }

  async send(message) {
    await this.#channel.send(message);
  }
}
