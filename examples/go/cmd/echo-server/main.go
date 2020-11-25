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
}
