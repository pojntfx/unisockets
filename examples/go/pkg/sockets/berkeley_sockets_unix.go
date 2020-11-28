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
	PF_INET     = uint16(C.PF_INET)
	SOCK_STREAM = int32(C.SOCK_STREAM)
)

func Socket(socketDomain uint16, socketType int32, socketProtocol int32) int32 {
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
	return int32(C.listen(C.int(socketFd), C.int(socketBacklog)))
}

func Accept(socketFd int32, socketAddr *SockaddrIn) int32 {
	addr := C.sockaddr_in{
		sin_family: C.ushort(socketAddr.SinFamily),
		sin_port:   C.ushort(socketAddr.SinPort),
		sin_addr: C.in_addr{
			s_addr: C.uint(socketAddr.SinAddr.SAddr),
		},
	}

	addrLen := C.uint(unsafe.Sizeof(socketAddr))

	rv := C.accept(C.int(socketFd), (*C.sockaddr)(unsafe.Pointer(&addr)), &addrLen)

	socketAddr.SinFamily = uint16(addr.sin_family)
	socketAddr.SinPort = uint16(addr.sin_port)
	socketAddr.SinAddr.SAddr = uint32(addr.sin_addr.s_addr)

	return int32(rv)
}

func Recv(socketFd int32, socketReceivedMessage *[]byte, socketBufferLength uint32, socketFlags int32) int32 {
	receivedMessage := C.CString(string(make([]byte, socketBufferLength)))
	defer C.free(unsafe.Pointer(receivedMessage))

	rv := int32(C.recv(C.int(socketFd), unsafe.Pointer(receivedMessage), C.ulong(socketBufferLength), C.int(socketFlags)))

	// TODO: Make sure that received message is converted properly

	outReceivedMessage := []byte(C.GoString(receivedMessage))

	socketReceivedMessage = &outReceivedMessage

	return rv
}

func Send(socketFd int32, socketMessageToSend []byte, socketFlags int32) int32 {
	messageToSend := C.CString(string(socketMessageToSend))
	defer C.free(unsafe.Pointer(messageToSend))

	return int32(C.send(C.int(socketFd), unsafe.Pointer(messageToSend), C.strlen(messageToSend), C.int(socketFlags)))
}

func Htons(v uint16) uint16 {
	return uint16(C.htons(C.ushort(v)))
}
