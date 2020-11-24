#ifndef BERKELEY_SOCKETS_H
#define BERKELEY_SOCKETS_H

#include <arpa/inet.h>

int berkeley_sockets_socket(int, int, int);
int berkeley_sockets_connect(int, const struct sockaddr *, socklen_t);
ssize_t berkeley_sockets_send(int, const void *, size_t, int);
ssize_t berkeley_sockets_recv(int, void *, size_t, int);
int berkeley_sockets_bind(int, const struct sockaddr *, socklen_t);
int berkeley_sockets_listen(int, int);
int berkeley_sockets_accept(int, struct sockaddr *, socklen_t *);

#define socket berkeley_sockets_socket
#define connect berkeley_sockets_connect
#define send berkeley_sockets_send
#define recv berkeley_sockets_recv
#define bind berkeley_sockets_bind
#define listen berkeley_sockets_listen
#define accept berkeley_sockets_accept

#endif /* BERKELEY_SOCKETS_H */