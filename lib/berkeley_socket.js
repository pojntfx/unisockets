import { once } from "events";

export default class BerkeleySocket {
  #family = 2; // AF_INET
  #stream = 1; // SOCK_STREAM
  #option = 0; // Default
  #port = 0;
  #addr = "";

  #connection = undefined;
  #receiver = undefined;
  #accepter = undefined;

  #onListen = () => {};

  #messages = [];
  #ids = [];

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

  async bind(family, port, addr, accepter, onListen) {
    this.#family = family;
    this.#port = port;
    this.#addr = addr;

    this.#accepter = accepter;
    this.#onListen = onListen;

    this.#accepter.on("connected", async (id) => {
      id != `${this.#addr}:${this.#port}` && this.#ids.push(id);
    });
  }

  async listen(_) {
    this.#onListen();
  }

  async accept(getReceiver, getConnection) {
    const newestId = this.#ids.slice(-1)[0];

    if (newestId) {
      this.#ids.pop();

      const port = parseInt(newestId.split(":")[1]);
      const address = newestId.split(":")[0];

      this.#connection = await getConnection(this.#family, port, address);
      this.#receiver = await getReceiver(this.#family, port, address);
      this.#receiver.on("message", async (message) => {
        this.#messages.push(message);
      });

      return {
        family: this.#family,
        port,
        address,
      };
    } else {
      const [id] = await once(this.#accepter, "connected");

      this.#ids.pop();

      const port = parseInt(id.split(":")[1]);
      const address = id.split(":")[0];

      this.#connection = await getConnection(this.#family, port, address);
      this.#receiver = await getReceiver(this.#family, port, address);
      this.#receiver.on("message", async (message) => {
        this.#messages.push(message);
      });

      return {
        family: this.#family,
        port,
        address,
      };
    }
  }

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
      const [message] = await once(this.#receiver, "message");

      this.#messages.pop();

      return message;
    }
  }
}
