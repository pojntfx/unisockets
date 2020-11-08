import wrtc from "wrtc";
const { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate } = wrtc;

export default class NetworkConnection {
  #config = {};

  #connection = undefined;
  #channel = undefined;

  #onConnect = () => {};
  #onCandidate = () => {};
  #onReceive = () => {};
  #onDisconnect = () => {};

  constructor(config, onConnect, onCandidate, onReceive, onDisconnect) {
    this.#config = config;
    this.#onConnect = onConnect;
    this.#onCandidate = onCandidate;
    this.#onReceive = onReceive;
    this.#onDisconnect = onDisconnect;
  }

  static Builder = class {
    #config = {};

    #onConnect = () => {};
    #onCandidate = () => {};
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

    setOnCandidate(handler) {
      this.#onCandidate = handler;

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
        this.#onCandidate,
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
    this.#connection.onicecandidate = async (e) => {
      e.candidate && this.#onCandidate(JSON.stringify(e.candidate));
    };

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
    this.#connection.onicecandidate = async (e) => {
      e.candidate && this.#onCandidate(JSON.stringify(e.candidate));
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

  async acceptCandidate(candidate) {
    this.#connection.addIceCandidate(new RTCIceCandidate(candidate));
  }

  async send(message) {
    await this.#channel.send(message);
  }
}
