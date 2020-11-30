// +build !js,!tinygo

package unisockets

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
	SHUT_RDWR   = int32(C.SHUT_RDWR)
)

func Socket(socketDomain uint16, socketType int32, socketProtocol int32) (int32, error) {
	rv, err := C.socket(C.int(socketDomain), C.int(socketType), C.int(socketProtocol))

	return int32(rv), err
}

func Bind(socketFd int32, socketAddr *SockaddrIn) error {
	addr := C.sockaddr_in{
		sin_family: C.ushort(socketAddr.SinFamily),
		sin_port:   C.ushort(socketAddr.SinPort),
		sin_addr: C.in_addr{
			s_addr: C.uint(socketAddr.SinAddr.SAddr),
		},
	}

	_, err := C.bind(C.int(socketFd), (*C.sockaddr)(unsafe.Pointer(&addr)), C.uint(unsafe.Sizeof(addr)))

	return err
}

func Listen(socketFd int32, socketBacklog int32) error {
	_, err := C.listen(C.int(socketFd), C.int(socketBacklog))

	return err
}

func Accept(socketFd int32, socketAddr *SockaddrIn) (int32, error) {
	addr := C.sockaddr_in{
		sin_family: C.ushort(socketAddr.SinFamily),
		sin_port:   C.ushort(socketAddr.SinPort),
		sin_addr: C.in_addr{
			s_addr: C.uint(socketAddr.SinAddr.SAddr),
		},
	}

	addrLen := C.uint(unsafe.Sizeof(socketAddr))

	rv, err := C.accept(C.int(socketFd), (*C.sockaddr)(unsafe.Pointer(&addr)), &addrLen)
	if err != nil {
		return int32(rv), err
	}

	socketAddr.SinFamily = uint16(addr.sin_family)
	socketAddr.SinPort = uint16(addr.sin_port)
	socketAddr.SinAddr.SAddr = uint32(addr.sin_addr.s_addr)

	return int32(rv), err
}

func Recv(socketFd int32, socketReceivedMessage *[]byte, socketBufferLength uint32, socketFlags int32) (int32, error) {
	receivedMessage := C.CString(string(make([]byte, socketBufferLength)))
	defer C.free(unsafe.Pointer(receivedMessage))

	rv, err := C.recv(C.int(socketFd), unsafe.Pointer(receivedMessage), C.ulong(socketBufferLength), C.int(socketFlags))
	if err != nil {
		return int32(rv), err
	}

	outReceivedMessage := []byte(C.GoString(receivedMessage))

	*socketReceivedMessage = outReceivedMessage

	return int32(rv), err
}

func Send(socketFd int32, socketMessageToSend []byte, socketFlags int32) (int32, error) {
	messageToSend := C.CString(string(socketMessageToSend))
	defer C.free(unsafe.Pointer(messageToSend))

	rv, err := C.send(C.int(socketFd), unsafe.Pointer(messageToSend), C.strlen(messageToSend), C.int(socketFlags))

	return int32(rv), err
}

func Shutdown(socketFd int32, socketFlags int32) error {
	_, err := C.shutdown(C.int(socketFd), C.int(socketFlags))

	return err
}

func Connect(socketFd int32, socketAddr *SockaddrIn) error {
	addr := C.sockaddr_in{
		sin_family: C.ushort(socketAddr.SinFamily),
		sin_port:   C.ushort(socketAddr.SinPort),
		sin_addr: C.in_addr{
			s_addr: C.uint(socketAddr.SinAddr.SAddr),
		},
	}

	_, err := C.connect(C.int(socketFd), (*C.sockaddr)(unsafe.Pointer(&addr)), C.uint(unsafe.Sizeof(addr)))

	return err
}

func Htons(v uint16) uint16 {
	return uint16(C.htons(C.ushort(v)))
}
