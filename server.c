#include <arpa/inet.h>
#include <errno.h>
#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <sys/socket.h>
#include <sys/types.h>

#define LISTEN_ADDR "0.0.0.0"
#define LISTEN_PORT 6912
#define LISTEN_MAX_CLIENTS 5
#define MESSAGE "Hello, client!\n"

int main() {
  // Variables
  int server_sock;
  int client_sock;

  struct sockaddr_in server_addr;
  struct sockaddr_in client_addr;

  socklen_t socket_length = sizeof(struct sockaddr_in);
  ssize_t sent_bytes;

  memset(&server_addr, 0, sizeof server_addr);
  memset(&client_addr, 0, sizeof client_addr);

  // Configuration
  server_addr.sin_family = AF_INET;
  server_addr.sin_port = htons(LISTEN_PORT);
  if (inet_pton(AF_INET, LISTEN_ADDR, &server_addr.sin_addr) == -1) {
    perror("inet_pton");

    exit(-1);
  }

  // Bind and listen
  if ((server_sock = socket(AF_INET, SOCK_STREAM, 0)) == -1) {
    perror("socket");

    exit(-1);
  }

  if ((bind(server_sock, (struct sockaddr *)&server_addr, socket_length)) ==
      -1) {
    perror("bind");

    exit(-1);
  }

  if ((listen(server_sock, LISTEN_MAX_CLIENTS)) == -1) {
    perror("listen");

    exit(-1);
  }

  printf("Listening on %s:%d\n", LISTEN_ADDR, LISTEN_PORT);

  // Accept and send
  while (1) {
    if ((client_sock = accept(server_sock, (struct sockaddr *)&client_addr,
                              &socket_length)) == -1) {
      perror("accept");

      exit(-1);
    }

    sent_bytes = send(client_sock, &MESSAGE, sizeof(MESSAGE), 0);

    printf("Sent %zd bytes to %s:%d\n", sent_bytes,
           inet_ntoa(client_addr.sin_addr), client_addr.sin_port);

    shutdown(client_sock, SHUT_RDWR);
  }

  return 0;
}