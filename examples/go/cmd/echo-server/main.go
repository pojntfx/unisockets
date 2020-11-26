package main

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
	"encoding/binary"
	"fmt"
	"log"
	"unsafe"
)

var (
	LOCAL_HOST = []byte{127, 0, 0, 1}
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
			s_addr: C.uint(binary.LittleEndian.Uint32(LOCAL_HOST)),
		},
	}
	serverAddressReadable := fmt.Sprintf("%v:%v", LOCAL_HOST, LOCAL_PORT)

	// Create socket
	serverSocket, err := C.socket(C.PF_INET, C.SOCK_STREAM, 0)
	if err != nil {
		log.Fatal("[ERROR] Could not create socket:", err)
	}

	// Bind
	if _, err := C.bind(serverSocket, (*C.sockaddr)(unsafe.Pointer(&serverAddress)), C.uint(unsafe.Sizeof(serverAddress))); err != nil {
		log.Fatalf("[ERROR] Could not bind socket %v: %v\n", serverAddressReadable, err)
	}

	// Listen
	if _, err := C.listen(serverSocket, MAX_CLIENTS); err != nil {
		log.Fatalf("[ERROR] Could not listen on socket %v: %v\n", serverAddressReadable, err)
	}

	log.Println("[INFO] Listening on", serverAddressReadable)

	for {
		log.Println("[DEBUG] Accepting on", serverAddressReadable)

		clientAddress := C.sockaddr_in{}
		clientAddressLength := C.uint(unsafe.Sizeof(clientAddress))

		// Accept
		clientSocket, err := C.accept(serverSocket, (*C.sockaddr)(unsafe.Pointer(&clientAddress)), &clientAddressLength)
		if err != nil {
			log.Println("[ERROR] Could not accept, continuing:", err)

			continue
		}

		clientHost := make([]byte, 4) // xxx.xxx.xxx.xxx
		binary.LittleEndian.PutUint32(clientHost, uint32(clientAddress.sin_addr.s_addr))

		clientAddressReadable := fmt.Sprintf("%v:%v", clientHost, clientAddress.sin_port)

		log.Println("[INFO] Accepted client", clientAddressReadable)

		for {
			log.Println("[DEBUG] Waiting for client to send")

			// Receive
			receivedMessage := C.CString(string(make([]byte, RECEIVED_MESSAGE_MAX_LENGTH)))
			defer C.free(unsafe.Pointer(receivedMessage))

			receivedMessageLength, err := C.recv(clientSocket, unsafe.Pointer(receivedMessage), C.ulong(RECEIVED_MESSAGE_MAX_LENGTH), 0)
			if err != nil {
				log.Printf("[ERROR] Could not receive from client %v, dropping message: %v\n", clientAddressReadable, err)

				continue
			}

			if receivedMessageLength == 0 {
				break
			}

			log.Printf("[DEBUG] Received %v bytes from %v\n", receivedMessageLength, clientAddressReadable)
		}
	}
}
