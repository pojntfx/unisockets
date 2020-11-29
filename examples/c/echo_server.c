#include "berkeley_sockets.h"
#include <arpa/inet.h>
#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <strings.h>
#include <sys/socket.h>
#include <sys/types.h>

#define LOCAL_HOST "127.0.0.1"
#define LOCAL_PORT 1234
#define BACKLOG 5

#define RECEIVED_MESSAGE_BUFFER_LENGTH 1024
#define SENT_MESSAGE_PREFIX "You've sent: "
#define SENT_MESSAGE_BUFFER_LENGTH                                             \
  RECEIVED_MESSAGE_BUFFER_LENGTH + sizeof(SENT_MESSAGE_PREFIX)

#ifdef IS_WASM
#undef LOCAL_HOST
#define LOCAL_HOST "10.0.0.240"
#endif

int main() {
  // Variables
  int server_sock;
  int client_sock;

  struct sockaddr_in server_address;
  struct sockaddr_in client_address;

  socklen_t server_socket_length = sizeof(struct sockaddr_in);

  size_t received_message_length;
  char received_message[RECEIVED_MESSAGE_BUFFER_LENGTH];
  ssize_t sent_message_length;
  char sent_message[SENT_MESSAGE_BUFFER_LENGTH];
  char client_address_readable[sizeof(client_address.sin_addr) +
                               client_address.sin_port + 1];
  char client_address_human_readable[INET_ADDRSTRLEN];

  // Logging
  char server_address_readable[sizeof(LOCAL_HOST) + sizeof(LOCAL_PORT) + 1];
  sprintf(server_address_readable, "%s:%d", LOCAL_HOST, LOCAL_PORT);

  memset(&server_address, 0, sizeof(server_address));
  memset(&client_address, 0, sizeof(client_address));

  // Create address
  server_address.sin_family = AF_INET;
  server_address.sin_port = htons(LOCAL_PORT);
  if (inet_pton(AF_INET, LOCAL_HOST, &server_address.sin_addr) == -1) {
    perror("[ERROR] Could not parse IP address:");

    exit(-1);
  }

  // Create socket
  if ((server_sock = socket(AF_INET, SOCK_STREAM, 0)) == -1) {
    perror("[ERROR] Could not create socket:");

    printf("[ERROR] Could not create socket %s\n", server_address_readable);

    exit(-1);
  }

  // Bind
  if ((bind(server_sock, (struct sockaddr *)&server_address,
            server_socket_length)) == -1) {
    perror("[ERROR] Could not bind to socket:");

    printf("[ERROR] Could not bind to socket %s\n", server_address_readable);

    exit(-1);
  }

  // Listen
  if ((listen(server_sock, BACKLOG)) == -1) {
    perror("[ERROR] Could not listen on socket:");

    printf("[ERROR] Could not listen on socket %s\n", server_address_readable);

    exit(-1);
  }

  printf("[INFO] Listening on %s\n", server_address_readable);

  // Accept loop
  while (1) {
    printf("[DEBUG] Accepting on %s\n", server_address_readable);

    // Accept
    if ((client_sock = accept(server_sock, (struct sockaddr *)&client_address,
                              &server_socket_length)) == -1) {
      perror("[ERROR] Could not accept, continuing:");

      continue;
    }

    if (inet_pton(AF_INET, LOCAL_HOST, &server_address.sin_addr) == -1) {
      perror("[ERROR] Could not parse IP address:");

      continue;
    }

    inet_ntop(AF_INET, &client_address.sin_addr, client_address_human_readable,
              sizeof(client_address_human_readable));

    sprintf(client_address_readable, "%s:%d", client_address_human_readable,
            client_address.sin_port);

    printf("[INFO] Accepted client %s\n", client_address_readable);

    // Receive loop
    received_message_length = 1;
    while (received_message_length) {
      memset(&received_message, 0, RECEIVED_MESSAGE_BUFFER_LENGTH);
      memset(&sent_message, 0, SENT_MESSAGE_BUFFER_LENGTH);

      printf("[DEBUG] Waiting for client %s to send\n",
             client_address_readable);

      // Receive
      received_message_length = recv(client_sock, &received_message,
                                     RECEIVED_MESSAGE_BUFFER_LENGTH, 0);
      if (received_message_length == -1) {
        perror("[ERROR] Could not receive from client:");

        printf("[ERROR] Could not receive from client %s, dropping message\n",
               client_address_readable);

        break;
      }

      if (received_message_length == 0) {
        break;
      }

      printf("[DEBUG] Received %zd bytes from %s\n", received_message_length,
             client_address_readable);

      // Process
      sprintf((char *)&sent_message, "%s%s", SENT_MESSAGE_PREFIX,
              received_message);
      sent_message[SENT_MESSAGE_BUFFER_LENGTH - 1] = '\0';

      // Send
      sent_message_length =
          send(client_sock, sent_message, SENT_MESSAGE_BUFFER_LENGTH, 0);
      if (sent_message_length == -1) {
        perror("[ERROR] Could not send to client:");

        printf("[ERROR] Could not send to client %s, dropping message\n",
               client_address_readable);

        break;
      }

      printf("[DEBUG] Sent %zd bytes to %s\n", sent_message_length,
             client_address_readable);
    }

    printf("[INFO] Client %s disconnected\n", client_address_readable);

    // Shutdown
    if ((shutdown(client_sock, SHUT_RDWR)) == -1) {
      perror("[ERROR] Could not shutdown socket:");

      printf("[ERROR] Could not shutdown socket %s, stopping\n",
             client_address_readable);

      break;
    };
  }

  return 0;
}