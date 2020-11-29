package main

import (
	"bufio"
	"encoding/binary"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/pojntfx/webassembly-berkeley-sockets-via-webrtc/examples/go/pkg/sockets"
)

var (
	SERVER_HOST = []byte{127, 0, 0, 1}
)

const (
	SERVER_PORT       = 1234
	RECONNECT_TIMEOUT = time.Second

	BUFFER_LENGTH = 1038
)

func main() {
	// Create address
	serverAddress := sockets.SockaddrIn{
		SinFamily: sockets.PF_INET,
		SinPort:   sockets.Htons(SERVER_PORT),
		SinAddr: struct{ SAddr uint32 }{
			SAddr: binary.LittleEndian.Uint32(SERVER_HOST),
		},
	}
	serverAddressReadable := fmt.Sprintf("%v:%v", SERVER_HOST, SERVER_PORT)

	// Create socket
	serverSocket, err := sockets.Socket(sockets.PF_INET, sockets.SOCK_STREAM, 0)
	if err != nil {
		log.Fatalf("[ERROR] Could not create socket %v: %v\n", serverAddressReadable, err)
	}

	// Create reader
	reader := bufio.NewReader(os.Stdin)

	// Connect loop
	for {
		log.Println("[INFO] Connecting to server", serverAddressReadable)

		// Connect
		if err := sockets.Connect(serverSocket, &serverAddress); err != nil {
			log.Printf("[ERROR] Could not connect to server %v, retrying in %v: %v\n", serverAddressReadable, RECONNECT_TIMEOUT, err)

			time.Sleep(RECONNECT_TIMEOUT)

			continue
		}

		log.Println("[INFO] Connected to server", serverAddressReadable)

		// Read loop
		for {
			log.Println("[DEBUG] Waiting for user input")

			// Read
			readMessage, err := reader.ReadString('\n')
			if err != nil {
				log.Fatal("[ERROR] Could not read from stdin:", err)
			}

			// Send
			sentMessage := []byte(readMessage)

			sentMessageLength, err := sockets.Send(serverSocket, sentMessage, 0)
			if err != nil {
				log.Printf("[ERROR] Could not send to server %v, dropping message: %v\n", serverAddressReadable, err)

				break
			}

			log.Printf("[DEBUG] Sent %v bytes to %v\n", sentMessageLength, serverAddressReadable)

			log.Printf("[DEBUG] Waiting for server %v to send\n", serverAddressReadable)

			// Receive
			receivedMessage := make([]byte, BUFFER_LENGTH)

			receivedMessageLength, err := sockets.Recv(serverSocket, &receivedMessage, BUFFER_LENGTH, 0)
			if err != nil {
				log.Printf("[ERROR] Could not receive from server %v, dropping message: %v\n", serverAddressReadable, err)

				continue
			}

			if receivedMessageLength == 0 {
				break
			}

			log.Printf("[DEBUG] Received %v bytes from %v\n", receivedMessageLength, serverAddressReadable)

			// Print
			fmt.Printf("%v", string(receivedMessage))
		}

		log.Println("[INFO] Disconnected from server", serverAddressReadable)

		// Shutdown
		if err := sockets.Shutdown(serverSocket, sockets.SHUT_RDWR); err != nil {
			log.Printf("[ERROR] Could not shutdown server socket %v, continuing: %v\n", serverAddressReadable, err)
		}
	}
}
