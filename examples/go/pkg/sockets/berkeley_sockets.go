// +build !js

package sockets

/*
#cgo CFLAGS: -DBERKELEY_SOCKETS_WITH_INVERSE_ALIAS

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include "berkeley_sockets.h"
*/
import "C"
import (
	"unsafe"
)

const (
	PF_INET     = int32(C.PF_INET)
	SOCK_STREAM = int32(C.SOCK_STREAM)
)

type SockaddrIn struct {
	SinFamily uint16
	SinPort   uint16
	SinAddr   struct {
		SAddr uint32
	}
}

func Socket(socketDomain int32, socketType int32, socketProtocol int32) int32 {
	return int32(C.socket(C.int(socketDomain), C.int(socketType), C.int(socketProtocol)))
}

func Bind(socketFd int32, socketAddr *SockaddrIn) int32 {
	addr := C.sockaddr_in{
		sin_family: C.ushort(socketAddr.SinFamily),
		sin_port:   C.ushort(socketAddr.SinPort),
		sin_addr: C.in_addr{
			s_addr: C.uint(socketAddr.SinAddr.SAddr),
		},
	}

	return int32(C.bind(C.int(socketFd), (*C.sockaddr)(unsafe.Pointer(&addr)), C.uint(unsafe.Sizeof(addr))))
}

func Listen(socketFd int32, socketBacklog int32) int32 {

}

func Accept(socketFd int32, socketAddr *SockaddrIn) int32 {

}

func Recv(socketFd int32, socketReceivedMessage *[]byte, socketBufferLength uint32, socketFlags int32) int32 {

}

func Send(socketFd int32, socketMessageToSend []byte, socketFlags int32) int32 {

}

func Htons(v uint16) uint16 {
	return uint16(C.htons(C.ushort(v)))
}
