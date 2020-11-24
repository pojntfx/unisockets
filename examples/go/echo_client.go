package main

/*
#include <berkeley_sockets.h>

typedef struct sockaddr_in sockaddr_in;
typedef struct in_addr in_addr;
*/
import "C"
import (
	"encoding/binary"
	"fmt"
)

const (
	remotePort = 1234
)

var (
	remoteHost = []byte{127, 0, 0, 1}
)

func main() {
	remoteAddress := C.sockaddr_in{
		sin_family: C.PF_INET,
		sin_port:   C.htons(remotePort),
		sin_addr: C.in_addr{
			s_addr: C.uint(binary.LittleEndian.Uint32(remoteHost)),
		},
	}

	remoteSocket := C.socket(C.PF_INET, C.SOCK_STREAM, 0)

	fmt.Println(remoteSocket, remoteAddress)
}
