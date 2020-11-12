#include <arpa/inet.h>
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

#define RECEIVED_MESSAGE_MAX_LENGTH 1024
#define SENT_MESSAGE_PREFIX "You've sent: "
#define SENT_MESSAGE_MAX_LENGTH                                                \
  RECEIVED_MESSAGE_MAX_LENGTH + sizeof(SENT_MESSAGE_PREFIX)

int main() {
  // Variables
  int server_sock;
  int client_sock;

  struct sockaddr_in server_addr;
  struct sockaddr_in client_addr;

  socklen_t server_socket_length = sizeof(struct sockaddr_in);

  size_t received_message_length;
  char received_message[RECEIVED_MESSAGE_MAX_LENGTH];
  ssize_t sent_message_length;
  char sent_message[SENT_MESSAGE_MAX_LENGTH];
  char client_addr_log[sizeof(client_addr.sin_addr) + client_addr.sin_port];

  memset(&server_addr, 0, sizeof(server_addr));
  memset(&client_addr, 0, sizeof(client_addr));

  // Create address to bind to
  server_addr.sin_family = AF_INET;
  server_addr.sin_port = htons(LISTEN_PORT);
  server_addr.sin_addr.s_addr = inet_addr(LISTEN_ADDR);
  memset(&server_addr.sin_zero, 0, 8);

  // Create socket
  if ((server_sock = socket(AF_INET, SOCK_STREAM, 0)) == -1) {
    perror("socket");

    exit(-1);
  }

  // Bind
  if ((bind(server_sock, (struct sockaddr *)&server_addr,
            server_socket_length)) == -1) {
    perror("bind");

    exit(-1);
  }

  // Listen
  if ((listen(server_sock, LISTEN_MAX_CLIENTS)) == -1) {
    perror("listen");

    exit(-1);
  }

  printf("Listening on %s:%d\n", LISTEN_ADDR, LISTEN_PORT);

  while (1) {
    // Accept
    if ((client_sock = accept(server_sock, (struct sockaddr *)&client_addr,
                              &server_socket_length)) == -1) {
      perror("accept");

      exit(-1);
    }

    sprintf(client_addr_log, "%s:%d", inet_ntoa(client_addr.sin_addr),
            client_addr.sin_port);

    printf("Client %s connected\n", client_addr_log);

    received_message_length = 1;
    while (received_message_length) {
      memset(&received_message, 0, RECEIVED_MESSAGE_MAX_LENGTH);
      memset(&sent_message, 0, SENT_MESSAGE_MAX_LENGTH);

      // Receive
      if ((received_message_length = recv(client_sock, &received_message,
                                          RECEIVED_MESSAGE_MAX_LENGTH, 0))) {
        sprintf((char *)&sent_message, "%s%s", SENT_MESSAGE_PREFIX,
                received_message);

        // Send
        sent_message_length =
            send(client_sock, sent_message, SENT_MESSAGE_MAX_LENGTH, 0);
        sent_message[SENT_MESSAGE_MAX_LENGTH - 1] = '\0';

        printf("Set %zd bytes to %s\n", sent_message_length, client_addr_log);
      }
    }

    printf("Client %s disconnected\n", client_addr_log);

    shutdown(client_sock, SHUT_RDWR);
  }

  return 0;
}