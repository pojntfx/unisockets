export class BerkeleySockets {
  #sockets = [];

  // Arguments are ignored for now
  socket(family, stream, option) {
    const newSocket = new Socket(family, stream, option, this.handleSend);

    this.#sockets.push(newSocket);

    return this.#sockets.length - 1;
  }

  getSocketByFileDescriptor(fd) {
    return this.#sockets[fd];
  }

  htons(val) {
    return ((val & 0xff) << 8) | ((val >> 8) & 0xff);
  }

  handleSend(message, option) {
    console.log(`sending with message=${message} option=${option}`);
  }
}

export class Socket {
  #family = 2; // AF_INET
  #stream = 1; // SOCK_STREAM
  #option = 0;

  #onSend = () => {};

  #port = 0;
  #addr = "";

  constructor(family, stream, option, onSend) {
    this.#family = family;
    this.#stream = stream;
    this.#option = option;

    this.#onSend = onSend;
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
}
