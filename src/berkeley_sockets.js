export class BerkeleySockets {
  #sockets = [];

  // Arguments are ignored for now
  async socket(family, stream, option) {
    const newSocket = new Socket(family, stream, option);

    this.#sockets.push(newSocket);

    return this.#sockets.length - 1;
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
}
