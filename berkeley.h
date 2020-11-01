#include <arpa/inet.h>
#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int berkeley_socket(int, int, int);
int berkeley_connect(int, const struct sockaddr *, socklen_t);
ssize_t berkeley_send(int, const void *, size_t, int);
ssize_t berkeley_recv(int, void *, size_t, int);