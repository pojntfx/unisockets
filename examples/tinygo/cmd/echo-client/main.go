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
	REMOTE_HOST = []byte{10, 0, 0, 240}
)

const (
	REMOTE_PORT                 = 1234
	RECONNECT_TIMEOUT           = time.Second
	RECEIVED_MESSAGE_MAX_LENGTH = 1038
	TEST_MESSAGE                = "Test Message" // No stdin support yet
)

func main() {
	// Create address
	remoteAddress := C.sockaddr_in{
		sin_family: C.PF_INET,
		sin_port:   C.htons(REMOTE_PORT),
		sin_addr: C.in_addr{
			s_addr: uint32(C.uint(binary.LittleEndian.Uint32(REMOTE_HOST))),
		},
	}
	remoteAddressReadable := fmt.Sprintf("%v:%v", REMOTE_HOST, REMOTE_PORT)

	// Create socket
	remoteSocket := C.berkeley_sockets_socket(C.PF_INET, C.SOCK_STREAM, 0)
	if remoteSocket == -1 {
		log.Fatal("[ERROR] Could not create socket:", remoteSocket)
	}

	for {
		log.Println("[INFO] Connecting to server", remoteAddressReadable)

		// Connect
		if err := C.berkeley_sockets_connect(remoteSocket, (*C.sockaddr)(unsafe.Pointer(&remoteAddress)), C.uint(unsafe.Sizeof(remoteAddress))); err == -1 {
			log.Printf("[ERROR] Could not connect to server %v, retrying in %v: %v\n", remoteAddressReadable, RECONNECT_TIMEOUT, err)

			time.Sleep(RECONNECT_TIMEOUT)

			continue
		}

		log.Println("[INFO] Connected to server", remoteAddressReadable)

		for {
			log.Println("[DEBUG] Waiting for user input")

			// Read
			time.Sleep(time.Second)
			readMessage := TEST_MESSAGE

			// Send
			sentMessage := CString(readMessage)
			defer C.free(unsafe.Pointer(sentMessage))

			sentMessageLength := C.berkeley_sockets_send(remoteSocket, unsafe.Pointer(sentMessage), C.strlen(sentMessage), 0)
			if sentMessageLength == -1 {
				log.Printf("[ERROR] Could not send to server %v, dropping message: %v\n", remoteAddressReadable, sentMessageLength)

				continue
			}

			log.Printf("[DEBUG] Sent %v bytes to %v\n", sentMessageLength, remoteAddressReadable)

			// Receive
			receivedMessage := CString(string(make([]byte, RECEIVED_MESSAGE_MAX_LENGTH)))
			defer C.free(unsafe.Pointer(receivedMessage))

			receivedMessageLength := C.berkeley_sockets_recv(remoteSocket, unsafe.Pointer(receivedMessage), C.ulong(RECEIVED_MESSAGE_MAX_LENGTH), 0)
			if receivedMessageLength == -1 {
				log.Printf("[ERROR] Could not receive from server %v, dropping message: %v\n", remoteAddressReadable, receivedMessageLength)

				continue
			}

			if receivedMessageLength == 0 {
				break
			}

			log.Printf("[DEBUG] Received %v bytes from %v\n", receivedMessageLength, remoteAddressReadable)

			fmt.Printf("%v", GoString(receivedMessage))
		}

		log.Println("[INFO] Disconnected from server", remoteAddressReadable)

		break
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
