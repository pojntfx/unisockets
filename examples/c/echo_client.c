#include <arpa/inet.h>
#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define REMOTE_ADDR "127.0.0.1"
#define REMOTE_PORT 1234
#define RECONNECT_TIMEOUT 2

#define SENT_MESSAGE_MAX_LENGTH 1024
#define RECEIVED_MESSAGE_PREFIX "You've sent: "
#define RECEIVED_MESSAGE_MAX_LENGTH                                            \
  SENT_MESSAGE_MAX_LENGTH + sizeof(RECEIVED_MESSAGE_PREFIX)

// If we're on WASM, use the custom implementation, else stick to the
// default includes
#ifdef IS_WASM
#include "berkeley_sockets.h"
#undef REMOTE_ADDR
#define REMOTE_ADDR "10.0.0.240"
#endif

int main() {
  // Variables
  int remote_sock;
  struct sockaddr_in remote_addr;

  ssize_t sent_message_length;
  char read_message[SENT_MESSAGE_MAX_LENGTH];
  size_t received_message_length;
  char received_message[RECEIVED_MESSAGE_MAX_LENGTH];

  socklen_t remote_addr_length = sizeof(struct sockaddr_in);

  memset(&remote_addr, 0, sizeof(remote_addr));

  // Logging
  char remote_address_readable[sizeof(REMOTE_ADDR) + sizeof(REMOTE_PORT) + 1];
  sprintf(remote_address_readable, "%s:%d", REMOTE_ADDR, REMOTE_PORT);

  // Create address to connect to
  remote_addr.sin_family = AF_INET;
  remote_addr.sin_port = htons(REMOTE_PORT);
  if (inet_pton(AF_INET, REMOTE_ADDR, &remote_addr.sin_addr) == -1) {
    perror("[ERROR] Could not parse IP address:");

    exit(-1);
  }

  // Create socket
  if ((remote_sock = socket(AF_INET, SOCK_STREAM, 0)) == -1) {
    perror("[ERROR] Could not create socket");

    exit(-1);
  }

  while (1) {
    printf("[INFO] Connecting to server %s\n", remote_address_readable);

    // Connect
    if ((connect(remote_sock, (struct sockaddr *)&remote_addr,
                 remote_addr_length)) == -1) {
      perror("[ERROR] Could not connect to server:");

      printf("[ERROR] Could not connect to server %s, retrying in %d seconds\n",
             remote_address_readable, RECONNECT_TIMEOUT);

      sleep(RECONNECT_TIMEOUT);

      continue;
    }

    printf("[INFO] Connected to server %s\n", remote_address_readable);

    while (1) {
      memset(&received_message, 0, RECEIVED_MESSAGE_MAX_LENGTH);
      memset(&read_message, 0, SENT_MESSAGE_MAX_LENGTH);

      printf("[DEBUG] Waiting for user input\n");

      // Read
      fgets(read_message, SENT_MESSAGE_MAX_LENGTH, stdin);

      // Send
      sent_message_length =
          send(remote_sock, read_message, strlen(read_message), 0);
      if (sent_message_length == -1) {
        perror("[ERROR] Could not send to server:");

        printf("[ERROR] Could not send to server %s, dropping message\n",
               remote_address_readable);

        continue;
      }

      printf("[DEBUG] Sent %zd bytes to %s\n", sent_message_length,
             remote_address_readable);

      // Receive
      received_message_length =
          recv(remote_sock, &received_message, RECEIVED_MESSAGE_MAX_LENGTH, 0);
      if (sent_message_length == -1) {
        perror("[ERROR] Could not receive from server:");

        printf("[ERROR] Could not receive from server %s, dropping message\n",
               remote_address_readable);

        continue;
      }

      if (received_message_length == 0) {
        break;
      }

      printf("[DEBUG] Received %zd bytes from %s\n", received_message_length,
             remote_address_readable);

      printf("%s", received_message);
    }

    printf("[INFO] Disconnected from server %s\n", remote_address_readable);

    // Shutdown
    if ((shutdown(remote_sock, SHUT_RDWR)) == -1) {
      perror("[ERROR] Could not shutdown socket, continuing:");
    };

    break;
  }

  return 0;
}