export default class BerkeleySocket {
  #family = 2; // AF_INET
  #stream = 1; // SOCK_STREAM
  #option = 0; // Default

  #connection = undefined;
  #receiver = undefined;

  #messages = [];

  constructor(family, stream, option) {
    this.#family = family;
    this.#stream = stream;
    this.#option = option;
  }

  static Builder = class {
    #family = 2; // AF_INET
    #stream = 1; // SOCK_STREAM
    #option = 0; // Default

    setFamily(family) {
      this.#family = family;

      return this;
    }

    setStream(stream) {
      this.#stream = stream;

      return this;
    }

    setOption(option) {
      this.#option = option;

      return this;
    }

    build() {
      return new BerkeleySocket(this.#family, this.#stream, this.#option);
    }
  };

  connect(connection, receiver) {
    this.#connection = connection;
    this.#receiver = receiver;

    this.#receiver.on("message", (message) => {
      this.#messages.push(message);
    });
  }

  send(message, _) {
    this.#connection.send(message);
  }

  recv(_) {
    return this.#messages.slice(-1)[0] || new Uint8Array();
  }
}
