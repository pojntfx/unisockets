// +build !js,tinygo,!wasi

package sockets

/*
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include "berkeley_sockets.h"
*/
import "C"
import "unsafe"

func socket(a C.int, b C.int, c C.int) C.int {
	return C.socket(a, b, c)
}

func connect(a C.int, b *C.sockaddr, c C.uint) C.int {
	return C.connect(a, b, c)
}

func bind(a C.int, b *C.sockaddr, c C.uint) C.int {
	return C.bind(a, b, c)
}

func listen(a C.int, b C.int) C.int {
	return C.listen(a, b)
}

func accept(a C.int, b *C.sockaddr, c *C.uint) C.int {
	return C.accept(a, b, c)
}

func recv(a C.int, b unsafe.Pointer, c C.ulong, d C.int) C.long {
	return C.recv(a, b, c, d)
}

func send(a C.int, b unsafe.Pointer, c C.ulong, d C.int) C.long {
	return C.send(a, b, c, d)
}

func shutdown(a C.int, b C.int) C.int {
	return C.shutdown(a, b)
}
