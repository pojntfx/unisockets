package main

/*
#include <berkeley_sockets.h>

typedef struct sockaddr sockaddr;
typedef struct sockaddr_in sockaddr_in;
typedef struct in_addr in_addr;
*/
import "C"
import (
	"encoding/binary"
	"fmt"
	"log"
	"time"
	"unsafe"
)

const (
	remotePort       = 1234
	reconnectTimeout = time.Second
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
	remoteAddressReadable := fmt.Sprintf("%v:%v", remoteHost, remotePort)

	remoteSocket := C.socket(C.PF_INET, C.SOCK_STREAM, 0)

	for {
		log.Printf("[INFO] Connecting to server %v\n", remoteAddressReadable)

		if err := C.connect(remoteSocket, (*C.sockaddr)(unsafe.Pointer(&remoteAddress)), C.uint(unsafe.Sizeof(remoteAddress))); err == -1 {
			C.perror(C.CString("connect"))

			log.Printf("[ERROR] Could not connect to server %v, retrying in %v\n", remoteAddressReadable, reconnectTimeout)

			time.Sleep(reconnectTimeout)

			continue
		}

		log.Printf("[INFO] Connected to server %v\n", remoteAddressReadable)

		receivedMessageLength := 1
		for receivedMessageLength != 0 {
			log.Println("[DEBUG] Waiting for input from user")

			var input string
			fmt.Scanln(&input)

			sentMessageLength := C.send(remoteSocket, unsafe.Pointer(C.CString(input)), C.ulong(len(input)), 0)

			log.Printf("[DEBUG] Sent %v bytes to %v\n", sentMessageLength, remoteAddressReadable)
		}

		break
	}
}
