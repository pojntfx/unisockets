#include <arpa/inet.h>
#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#define REMOTE_ADDR "127.0.0.1"
#define REMOTE_PORT 6912

#define SENT_MESSAGE_MAX_LENGTH 1024
#define RECEIVED_MESSAGE_PREFIX "You've sent: "
#define RECEIVED_MESSAGE_MAX_LENGTH                                            \
  SENT_MESSAGE_MAX_LENGTH + sizeof(RECEIVED_MESSAGE_PREFIX)

int main() {
  // Variables
  int server_sock;
  struct sockaddr_in server_addr;

  char input[SENT_MESSAGE_MAX_LENGTH];
  char output[RECEIVED_MESSAGE_MAX_LENGTH];

  socklen_t server_socket_length = sizeof(struct sockaddr_in);

  memset(&server_addr, 0, sizeof(server_addr));

  // Create address to connect to
  server_addr.sin_family = AF_INET;
  server_addr.sin_port = htons(REMOTE_PORT);
  server_addr.sin_addr.s_addr = inet_addr(REMOTE_ADDR);
  memset(&server_addr.sin_zero, 0, 8);

  // Create socket
  if ((server_sock = socket(AF_INET, SOCK_STREAM, 0)) == -1) {
    perror("socket");

    exit(-1);
  }

  // Connect
  if ((connect(server_sock, (struct sockaddr *)&server_addr,
               server_socket_length)) == -1) {
    perror("connect");

    exit(-1);
  }

  return 0;
}