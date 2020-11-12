#include <netinet/in.h>
#include <stdlib.h>

int transfer_to_runtime(int, int *, size_t);
int transfer_to_runtime_sockaddr_in(struct sockaddr_in *, size_t);