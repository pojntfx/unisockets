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

  async connect(connection, receiver) {
    this.#connection = connection;
    this.#receiver = receiver;

    this.#receiver.on("message", async (message) => {
      this.#messages.push(message);
    });
  }

  async send(message, _) {
    await this.#connection.send(message);
  }

  async recv(_) {
    const newestMessage = this.#messages.slice(-1)[0];

    if (newestMessage) {
      this.#messages.pop();

      return newestMessage;
    } else {
      let listener = undefined;

      const message = await new Promise((res) => {
        listener = (message) => {
          this.#messages.pop();

          res(message);
        };
        this.#receiver.on("message", listener);
      });
      this.#receiver.off("message", listener);

      return message;
    }
  }
}
