// +build !js,tinygo,wasi

package unisockets

/*
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include "unisockets.h"
*/
import "C"
import "unsafe"

func socket(a C.int, b C.int, c C.int) C.int {
	return C.unisockets_socket(a, b, c)
}

func connect(a C.int, b *C.sockaddr, c C.uint) C.int {
	return C.unisockets_connect(a, b, c)
}

func bind(a C.int, b *C.sockaddr, c C.uint) C.int {
	return C.unisockets_bind(a, b, c)
}

func listen(a C.int, b C.int) C.int {
	return C.unisockets_listen(a, b)
}

func accept(a C.int, b *C.sockaddr, c *C.uint) C.int {
	return C.unisockets_accept(a, b, c)
}

func recv(a C.int, b unsafe.Pointer, c C.ulong, d C.int) C.long {
	return C.unisockets_recv(a, b, c, d)
}

func send(a C.int, b unsafe.Pointer, c C.ulong, d C.int) C.long {
	return C.unisockets_send(a, b, c, d)
}

func shutdown(a C.int, b C.int) C.int {
	// Not necessary on WASM

	return C.int(0)
}
