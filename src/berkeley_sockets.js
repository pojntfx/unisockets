export class BerkeleySockets {
  #sockets = [];

  // Arguments are ignored for now
  socket(family, stream, option) {
    const newSocket = new Socket(family, stream, option);

    this.#sockets.push(newSocket);

    return this.#sockets.length - 1;
  }

  getSocket(fd) {
    return this.#sockets[fd];
  }

  htons(val) {
    return ((val & 0xff) << 8) | ((val >> 8) & 0xff);
  }
}

export class Socket {
  #family = 2; // AF_INET
  #stream = 1; // SOCK_STREAM
  #option = 0;

  constructor(family, stream, option) {
    this.#family = family;
    this.#stream = stream;
    this.#option = option;
  }

  connect(family, port, addr) {
    console.log(`family=${family} port=${port} addr=${addr}`);
  }
}
