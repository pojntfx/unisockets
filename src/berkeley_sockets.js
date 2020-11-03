export class BerkeleySockets {
  #sockets = [];

  toExternalFd(internalFd) {
    return internalFd + 65535;
  }

  toInternalFd(externalFd) {
    return externalFd - 65535;
  }

  socket(family, stream, option) {
    const fd = this.toExternalFd(this.#sockets.length);

    const newSocket = new Socket(
      family,
      stream,
      option,
      (message, option) => this.handleSend(fd, message, option),
      (option) => this.handleRecv(fd, option)
    );

    this.#sockets.push([newSocket, []]);

    return fd;
  }

  getSocketByFileDescriptor(fd) {
    const socket = this.#sockets[this.toInternalFd(fd)];

    return socket ? socket[0] : undefined;
  }

  htons(val) {
    return ((val & 0xff) << 8) | ((val >> 8) & 0xff);
  }

  handleSend(fd, message, option) {
    // TODO: Connect remote API
    console.log(
      `sending with fd=${this.toInternalFd(
        fd
      )} message=${message} option=${option}`
    );

    this.#sockets[this.toInternalFd(fd)][1] = [
      ...this.#sockets[this.toInternalFd(fd)][1],
      message,
    ];
  }

  handleRecv(fd, option) {
    // TODO: Connect remote API
    const message = new Uint8Array(this.#sockets[this.toInternalFd(fd)][1][0]); // Create a copy of the first message

    this.#sockets[this.toInternalFd(fd)][1].shift();

    console.log(
      `receiving with fd=${this.toInternalFd(fd)} length=${
        message.length
      } option=${option}`
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
