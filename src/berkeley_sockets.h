#ifndef BERKELEY_SOCKETS_H
#define BERKELEY_SOCKETS_H

#include <arpa/inet.h>

int berkeley_sockets_socket(int, int, int);
int berkeley_sockets_connect(int, const struct sockaddr *, socklen_t);
ssize_t berkeley_sockets_send(int, const void *, size_t, int);
ssize_t berkeley_sockets_recv(int, void *, size_t, int);

#define socket berkeley_sockets_socket
#define connect berkeley_sockets_connect
// #define send berkeley_sockets_send
#define recv berkeley_sockets_recv

#endif /* BERKELEY_SOCKETS_H */