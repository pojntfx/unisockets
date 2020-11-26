package main

/*
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include "berkeley_sockets.h"
*/
import "C"
import (
	"encoding/binary"
	"fmt"
	"log"
	"time"
	"unsafe"
)

var (
	LOCAL_HOST = []byte{10, 0, 0, 240}
)

const (
	LOCAL_PORT                  = 1234
	RECEIVED_MESSAGE_MAX_LENGTH = 1024
	SENT_MESSAGE_MAX_LENGTH     = 1038
	MAX_CLIENTS                 = 5
)

type Client struct {
	Socket          C.int
	Address         C.sockaddr_in
	AddressLength   C.uint
	AddressReadable string
}

func main() {
	// Create address
	serverAddress := C.sockaddr_in{
		sin_family: C.PF_INET,
		sin_port:   C.htons(LOCAL_PORT),
		sin_addr: C.in_addr{
			s_addr: uint32(C.uint(binary.LittleEndian.Uint32(LOCAL_HOST))),
		},
	}
	serverAddressReadable := fmt.Sprintf("%v:%v", LOCAL_HOST, LOCAL_PORT)

	// Create socket
	serverSocket := C.berkeley_sockets_socket(C.PF_INET, C.SOCK_STREAM, 0)
	if serverSocket == -1 {
		log.Fatal("[ERROR] Could not create socket:", serverSocket)
	}

	// Bind
	if err := C.berkeley_sockets_bind(serverSocket, (*C.sockaddr)(unsafe.Pointer(&serverAddress)), C.uint(unsafe.Sizeof(serverAddress))); err == -1 {
		log.Fatalf("[ERROR] Could not bind socket %v: %v\n", serverAddressReadable, err)
	}

	// Listen
	if err := C.berkeley_sockets_listen(serverSocket, MAX_CLIENTS); err == -1 {
		log.Fatalf("[ERROR] Could not listen on socket %v: %v\n", serverAddressReadable, err)
	}

	log.Println("[INFO] Listening on", serverAddressReadable)

	// Accept loop
	for {
		log.Println("[DEBUG] Accepting on", serverAddressReadable)

		clientAddress := C.sockaddr_in{}
		clientAddressLength := C.uint(unsafe.Sizeof(clientAddress))

		// Accept
		clientSocket := C.berkeley_sockets_accept(serverSocket, (*C.sockaddr)(unsafe.Pointer(&clientAddress)), &clientAddressLength)
		if clientSocket == -1 {
			log.Println("[ERROR] Could not accept, continuing:", clientSocket)

			continue
		}

		clientHost := make([]byte, 4) // xxx.xxx.xxx.xxx
		binary.LittleEndian.PutUint32(clientHost, uint32(clientAddress.sin_addr.s_addr))

		clientAddressReadable := fmt.Sprintf("%v:%v", clientHost, clientAddress.sin_port)

		log.Println("[INFO] Accepted client", clientAddressReadable)

		go func(innerClient Client) {
			// Receive loop
			for {
				log.Printf("[DEBUG] Waiting for client %v to send\n", innerClient.AddressReadable)

				time.Sleep(time.Second)
			}
		}(Client{
			Socket:          clientSocket,
			Address:         clientAddress,
			AddressLength:   clientAddressLength,
			AddressReadable: clientAddressReadable,
		})
	}
}

// See https://github.com/bgould/go-littlefs/blob/master/go_lfs.go#L415-L430

func CString(s string) *C.char {
	ptr := C.malloc(C.size_t(len(s) + 1))
	buf := (*[1 << 28]byte)(ptr)[: len(s)+1 : len(s)+1]
	copy(buf, s)
	buf[len(s)] = 0
	return (*C.char)(ptr)
}

func GoString(s *C.char) string {
	slen := int(C.strlen(s))
	sbuf := make([]byte, slen)
	copy(sbuf, (*[1 << 28]byte)(unsafe.Pointer(s))[:slen:slen])
	return string(sbuf)
}
