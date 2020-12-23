#ifndef UNISOCKETS_H
#define UNISOCKETS_H

#ifdef UNISOCKETS_WITH_CUSTOM_ARPA_INET
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
#define SHUT_RDWR 2

uint16_t htons(uint16_t v) { return (v >> 8) | (v << 8); }
#else
#include <arpa/inet.h>
#endif

typedef struct sockaddr sockaddr;
typedef struct sockaddr_in sockaddr_in;
typedef struct in_addr in_addr;

#ifndef UNISOCKETS_WITH_INVERSE_ALIAS
int unisockets_socket(int, int, int);
int unisockets_connect(int, const struct sockaddr *, socklen_t);
ssize_t unisockets_send(int, const void *, size_t, int);
ssize_t unisockets_recv(int, void *, size_t, int);
int unisockets_bind(int, const struct sockaddr *, socklen_t);
int unisockets_listen(int, int);
int unisockets_accept(int, struct sockaddr *, socklen_t *);
#endif

#ifdef UNISOCKETS_WITH_ALIAS
#define socket unisockets_socket
#define connect unisockets_connect
#define send unisockets_send
#define recv unisockets_recv
#define bind unisockets_bind
#define listen unisockets_listen
#define accept unisockets_accept
#endif

#ifdef UNISOCKETS_WITH_INVERSE_ALIAS
#define unisockets_socket socket
#define unisockets_connect connect
#define unisockets_send send
#define unisockets_recv recv
#define unisockets_bind bind
#define unisockets_listen listen
#define unisockets_accept accept
#endif

#endif /* UNISOCKETS_H */