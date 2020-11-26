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

		// TODO: Make asynchronous like in Go
		// go func() {
		clientHost := make([]byte, 4) // xxx.xxx.xxx.xxx
		binary.LittleEndian.PutUint32(clientHost, uint32(clientAddress.sin_addr.s_addr))

		clientAddressReadable := fmt.Sprintf("%v:%v", clientHost, clientAddress.sin_port)

		log.Println("[INFO] Accepted client", clientAddressReadable)

		for {
			log.Println("[DEBUG] Waiting for client to send")

			// Receive
			receivedMessage := CString(string(make([]byte, RECEIVED_MESSAGE_MAX_LENGTH)))
			defer C.free(unsafe.Pointer(receivedMessage))

			receivedMessageLength := C.berkeley_sockets_recv(clientSocket, unsafe.Pointer(receivedMessage), C.ulong(RECEIVED_MESSAGE_MAX_LENGTH), 0)
			if receivedMessageLength == -1 {
				log.Printf("[ERROR] Could not receive from client %v, dropping message: %v\n", clientAddressReadable, receivedMessageLength)

				continue
			}

			if receivedMessageLength == 0 {
				break
			}

			log.Printf("[DEBUG] Received %v bytes from %v\n", receivedMessageLength, clientAddressReadable)

			// Send
			sentMessage := CString(fmt.Sprintf("You've sent: %v", GoString(receivedMessage)))
			defer C.free(unsafe.Pointer(sentMessage))

			sentMessageLength := C.berkeley_sockets_send(clientSocket, unsafe.Pointer(sentMessage), C.strlen(sentMessage), 0)
			if sentMessageLength == -1 {
				log.Printf("[ERROR] Could not send to client %v, dropping message: %v\n", clientAddressReadable, sentMessageLength)

				continue
			}

			log.Printf("[DEBUG] Sent %v bytes to %v\n", sentMessageLength, clientAddressReadable)
		}

		log.Println("[INFO] Disconnected from client", clientAddressReadable)
		// }()
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
