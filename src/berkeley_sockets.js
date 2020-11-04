export class BerkeleySockets {
  #sockets = [];

  socket(family, stream, option) {
    const fd = this.#sockets.length;

    const newSocket = new Socket(
      family,
      stream,
      option,
      (message, option) => this.handleSend(fd, message, option),
      (option) => this.handleRecv(fd, option),
      (maxClients) => this.handleListen(fd, maxClients),
      () => this.handleAccept(fd)
    );

    this.#sockets.push([newSocket, []]);

    return fd;
  }

  getSocketByFileDescriptor(fd) {
    return this.#sockets[fd][0];
  }

  htons(val) {
    return ((val & 0xff) << 8) | ((val >> 8) & 0xff);
  }

  getUint2(val) {
    const sinVal = new ArrayBuffer(4);

    new Int32Array(sinVal)[0] = val;

    const outVal = Array.from(new Uint8Array(sinVal)).reverse();

    return [outVal[2], outVal[3]];
  }

  handleSend(fd, message, option) {
    // TODO: Connect remote API
    console.log(`sending with fd=${fd} message=${message} option=${option}`);

    this.#sockets[fd][1] = [...this.#sockets[fd][1], message];
  }

  handleRecv(fd, option) {
    // TODO: Connect remote API
    const message = new Uint8Array(this.#sockets[fd][1][0]); // Create a copy of the first message

    this.#sockets[fd][1].shift();

    console.log(
      `receiving with fd=${fd} length=${message.length} option=${option}`
    );

    return message;
  }

  handleListen(fd, maxClients) {
    // TODO: Connect remote API
  }

  handleAccept(fd) {
    return {
      family: 1,
      port: 1234,
      address: "127.0.0.1",
    };
  }
}

export class Socket {
  #family = 2; // AF_INET
  #stream = 1; // SOCK_STREAM
  #option = 0;

  #onSend = () => {};
  #onRecv = () => {};
  #onListen = () => {};
  #onAccept = () => {};

  #port = 0;
  #addr = "";

  constructor(family, stream, option, onSend, onRecv, onListen, onAccept) {
    this.#family = family;
    this.#stream = stream;
    this.#option = option;

    this.#onSend = onSend;
    this.#onRecv = onRecv;
    this.#onListen = onListen;
    this.#onAccept = onAccept;
  }

  bind(family, port, addr) {
    console.log(`binding with family=${family} port=${port} addr=${addr}`);

    this.#family = family;
    this.#port = port;
    this.#addr = addr;
  }

  listen(maxClients) {
    this.#onListen(maxClients);
  }

  send(message, option) {
    this.#onSend(message, option);
  }

  recv(option) {
    return this.#onRecv(option);
  }

  accept() {
    return this.#onAccept();
  }
}
