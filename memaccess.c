#include "memaccess.h"
#include <arpa/inet.h>
#include <netinet/in.h>
#include <stdio.h>

#define REMOTE_ADDR "127.0.0.1"
#define REMOTE_PORT 6912

struct test_struct {
  char *my_string;
  int my_int;
};

int main() {
  int my_positive_int = 239234;

  printf("(binary) value=%d pointer=%p size=%lu\n", my_positive_int,
         &my_positive_int, sizeof(my_positive_int));

  transfer_to_runtime(my_positive_int, &my_positive_int,
                      sizeof(my_positive_int));

  int my_negative_int = -239234;

  printf("(binary) value=%d pointer=%p size=%lu\n", my_negative_int,
         &my_negative_int, sizeof(my_negative_int));

  transfer_to_runtime(my_negative_int, &my_negative_int,
                      sizeof(my_negative_int));

  printf("size before filling=%lu\n", sizeof(struct test_struct));

  struct test_struct my_test_struct;
  my_test_struct.my_string = "asdf";
  my_test_struct.my_int = 234234;

  printf("my_string=%s my_int=%d\n", my_test_struct.my_string,
         my_test_struct.my_int);

  printf("size after filling=%lu\n", sizeof(struct test_struct));

  printf("before=%d after=%d\n", REMOTE_PORT, htons(REMOTE_PORT));

  struct sockaddr_in server_addr;
  server_addr.sin_family = AF_INET;
  server_addr.sin_port = htons(REMOTE_PORT);
  if (inet_pton(AF_INET, REMOTE_ADDR, &server_addr.sin_addr) == -1) {
    perror("inet_pton");

    exit(-1);
  }
  socklen_t server_socket_length = sizeof(struct sockaddr_in);

  printf("server_addr=%lu sin_port=%lu sin_family=%lu sin_addr=%lu\n",
         sizeof(server_addr), sizeof(server_addr.sin_port),
         sizeof(server_addr.sin_family),
         sizeof(server_addr.sin_addr)); // The rest are 8 bytes of zero

  transfer_to_runtime_sockaddr_in(&server_addr, server_socket_length);

  return 0;
}