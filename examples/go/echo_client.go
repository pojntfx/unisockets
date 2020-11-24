package main

/*
#include <arpa/inet.h>
#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

// If we're on WASM, use the custom implementation, else stick to the
// default includes
#ifdef IS_WASM
#include "berkeley_sockets.h"
#endif

typedef struct sockaddr sockaddr;
typedef struct sockaddr_in sockaddr_in;
typedef struct in_addr in_addr;
*/
import "C"
import (
	"bufio"
	"encoding/binary"
	"fmt"
	"log"
	"os"
	"time"
	"unsafe"
)

var (
	REMOTE_HOST = []byte{127, 0, 0, 1}
)

const (
	REMOTE_PORT                 = 1234
	RECONNECT_TIMEOUT           = time.Second
	RECEIVED_MESSAGE_MAX_LENGTH = 1038
)

func main() {
	// Create address
	remoteAddress := C.sockaddr_in{
		sin_family: C.PF_INET,
		sin_port:   C.htons(REMOTE_PORT),
		sin_addr: C.in_addr{
			s_addr: C.uint(binary.LittleEndian.Uint32(REMOTE_HOST)),
		},
	}
	remoteAddressReadable := fmt.Sprintf("%v:%v", REMOTE_HOST, REMOTE_PORT)

	// Create socket
	remoteSocket, err := C.socket(C.PF_INET, C.SOCK_STREAM, 0)
	if err != nil {
		log.Fatal("[ERROR] Could not create socket:", err)
	}

	// Create reader
	reader := bufio.NewReader(os.Stdin)

	for {
		log.Println("[INFO] Connecting to server", remoteAddressReadable)

		// Connect
		if _, err := C.connect(remoteSocket, (*C.sockaddr)(unsafe.Pointer(&remoteAddress)), C.uint(unsafe.Sizeof(remoteAddress))); err != nil {
			log.Printf("[ERROR] Could not connect to server %v, retrying in %v: %v\n", remoteAddressReadable, RECONNECT_TIMEOUT, err)

			time.Sleep(RECONNECT_TIMEOUT)

			continue
		}

		log.Println("[INFO] Connected to server", remoteAddressReadable)

		for {
			log.Println("[DEBUG] Waiting for user input")

			// Read
			readMessage, err := reader.ReadString('\n')
			if err != nil {
				log.Fatal("[ERROR] Could not read from stdin:", err)
			}

			// Send
			sentMessage := C.CString(readMessage)
			defer C.free(unsafe.Pointer(sentMessage))

			sentMessageLength, err := C.send(remoteSocket, unsafe.Pointer(sentMessage), C.strlen(sentMessage), 0)
			if err != nil {
				log.Printf("[ERROR] Could not send to server %v, dropping message: %v\n", remoteAddressReadable, err)

				continue
			}

			log.Printf("[DEBUG] Sent %v bytes to %v\n", sentMessageLength, remoteAddressReadable)

			// Receive
			receivedMessage := C.CString(string(make([]byte, RECEIVED_MESSAGE_MAX_LENGTH)))
			defer C.free(unsafe.Pointer(receivedMessage))

			receivedMessageLength, err := C.recv(remoteSocket, unsafe.Pointer(receivedMessage), C.ulong(RECEIVED_MESSAGE_MAX_LENGTH), 0)
			if err != nil {
				log.Printf("[ERROR] Could not receive from server %v, dropping message: %v\n", remoteAddressReadable, err)

				continue
			}

			if receivedMessageLength == 0 {
				break
			}

			log.Printf("[DEBUG] Received %v bytes from %v\n", receivedMessageLength, remoteAddressReadable)

			fmt.Printf("%v", C.GoString(receivedMessage))
		}

		log.Println("[INFO] Disconnected from server", remoteAddressReadable)

		// Shutdown
		if _, err := C.shutdown(remoteSocket, C.SHUT_RDWR); err != nil {
			log.Println("[ERROR] Could not shutdown socket, continuing:", err)
		}

		break
	}
}
