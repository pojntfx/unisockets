#ifndef BERKELEY_SOCKETS_H
#define BERKELEY_SOCKETS_H

#ifdef BERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET
#define _Addr long
typedef _Addr ssize_t;
typedef unsigned _Addr size_t;
typedef unsigned socklen_t;
typedef unsigned short sa_family_t;
typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef unsigned int uint32_t;
typedef uint16_t in_port_t;
typedef uint32_t in_addr_t;

struct sockaddr {
  sa_family_t sa_family;
  char sa_data[14];
};
struct in_addr {
  in_addr_t s_addr;
};
struct sockaddr_in {
  sa_family_t sin_family;
  in_port_t sin_port;
  struct in_addr sin_addr;
  uint8_t sin_zero[8];
};

#define PF_INET 2
#define SOCK_STREAM 1

uint16_t htons(uint16_t v) { return (v >> 8) | (v << 8); }
#else
#include <arpa/inet.h>
#endif

typedef struct sockaddr sockaddr;
typedef struct sockaddr_in sockaddr_in;
typedef struct in_addr in_addr;

#ifndef BERKELEY_SOCKETS_WITH_INVERSE_ALIAS
int berkeley_sockets_socket(int, int, int);
int berkeley_sockets_connect(int, const struct sockaddr *, socklen_t);
ssize_t berkeley_sockets_send(int, const void *, size_t, int);
ssize_t berkeley_sockets_recv(int, void *, size_t, int);
int berkeley_sockets_bind(int, const struct sockaddr *, socklen_t);
int berkeley_sockets_listen(int, int);
int berkeley_sockets_accept(int, struct sockaddr *, socklen_t *);
#endif

#ifdef BERKELEY_SOCKETS_WITH_ALIAS
#define socket berkeley_sockets_socket
#define connect berkeley_sockets_connect
#define send berkeley_sockets_send
#define recv berkeley_sockets_recv
#define bind berkeley_sockets_bind
#define listen berkeley_sockets_listen
#define accept berkeley_sockets_accept
#endif

#ifdef BERKELEY_SOCKETS_WITH_INVERSE_ALIAS
#define berkeley_sockets_socket socket
#define berkeley_sockets_connect connect
#define berkeley_sockets_send send
#define berkeley_sockets_recv recv
#define berkeley_sockets_bind bind
#define berkeley_sockets_listen listen
#define berkeley_sockets_accept accept
#endif

#endif /* BERKELEY_SOCKETS_H */