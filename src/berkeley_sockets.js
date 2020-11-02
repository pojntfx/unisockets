export class BerkeleySockets {
  #sockets = [];

  socket(family, stream, option) {
    const fd = this.#sockets.length;

    const newSocket = new Socket(
      family,
      stream,
      option,
      (args) => this.handleSend(fd, ...args),
      (option) => this.handleRecv(fd, option)
    );

    this.#sockets.push([
      newSocket,
      [new TextEncoder().encode("test message to self")], // TODO: Remove this example message
    ]);

    return fd;
  }

  getSocketByFileDescriptor(fd) {
    return this.#sockets[fd][0];
  }

  htons(val) {
    return ((val & 0xff) << 8) | ((val >> 8) & 0xff);
  }

  handleSend(fd, message, option) {
    console.log(`sending with fd=${fd} message=${message} option=${option}`);
  }

  handleRecv(fd, option) {
    const message = new Uint8Array(this.#sockets[fd][1][0]); // Create a copy of the first message

    this.#sockets[fd][1].shift();

    console.log(
      `receiving with fd=${fd} length=${message.length} option=${option}`
    );

    return message;
  }
}

export class Socket {
  #family = 2; // AF_INET
  #stream = 1; // SOCK_STREAM
  #option = 0;

  #onSend = () => {};
  #onRecv = () => {};

  #port = 0;
  #addr = "";

  constructor(family, stream, option, onSend, onRecv) {
    this.#family = family;
    this.#stream = stream;
    this.#option = option;

    this.#onSend = onSend;
    this.#onRecv = onRecv;
  }

  connect(family, port, addr) {
    console.log(`connecting with family=${family} port=${port} addr=${addr}`);

    this.#family = family;
    this.#port = port;
    this.#addr = addr;
  }

  send(message, option) {
    this.#onSend(message, option);
  }

  recv(option) {
    return this.#onRecv(option);
  }
}
