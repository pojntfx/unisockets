package main

import (
	"bufio"
	"encoding/binary"
	"fmt"
	"os"
	"time"

	"github.com/pojntfx/unisockets/pkg/unisockets"
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
	serverAddress := unisockets.SockaddrIn{
		SinFamily: unisockets.PF_INET,
		SinPort:   unisockets.Htons(SERVER_PORT),
		SinAddr: struct{ SAddr uint32 }{
			SAddr: binary.LittleEndian.Uint32(SERVER_HOST),
		},
	}
	serverAddressReadable := fmt.Sprintf("%v:%v", SERVER_HOST, SERVER_PORT)

	// Create socket
	serverSocket, err := unisockets.Socket(unisockets.PF_INET, unisockets.SOCK_STREAM, 0)
	if err != nil {
		fmt.Printf("[ERROR] Could not create socket %v: %v\n", serverAddressReadable, err)

		os.Exit(1)
	}

	// Create reader
	reader := bufio.NewReader(os.Stdin)

	// Connect loop
	for {
		fmt.Println("[INFO] Connecting to server", serverAddressReadable)

		// Connect
		if err := unisockets.Connect(serverSocket, &serverAddress); err != nil {
			fmt.Printf("[ERROR] Could not connect to server %v, retrying in %v: %v\n", serverAddressReadable, RECONNECT_TIMEOUT, err)

			time.Sleep(RECONNECT_TIMEOUT)

			continue
		}

		fmt.Println("[INFO] Connected to server", serverAddressReadable)

		// Read loop
		for {
			fmt.Println("[DEBUG] Waiting for user input")

			// Read
			readMessage, err := reader.ReadString('\n')
			if err != nil {
				fmt.Println("[ERROR] Could not read from stdin:", err)
			}

			// Send
			sentMessage := []byte(readMessage)

			sentMessageLength, err := unisockets.Send(serverSocket, sentMessage, 0)
			if err != nil {
				fmt.Printf("[ERROR] Could not send to server %v, dropping message: %v\n", serverAddressReadable, err)

				break
			}

			fmt.Printf("[DEBUG] Sent %v bytes to %v\n", sentMessageLength, serverAddressReadable)

			fmt.Printf("[DEBUG] Waiting for server %v to send\n", serverAddressReadable)

			// Receive
			receivedMessage := make([]byte, BUFFER_LENGTH)

			receivedMessageLength, err := unisockets.Recv(serverSocket, &receivedMessage, BUFFER_LENGTH, 0)
			if err != nil {
				fmt.Printf("[ERROR] Could not receive from server %v, dropping message: %v\n", serverAddressReadable, err)

				break
			}

			if receivedMessageLength == 0 {
				break
			}

			fmt.Printf("[DEBUG] Received %v bytes from %v\n", receivedMessageLength, serverAddressReadable)

			// Print
			fmt.Printf("%v", string(receivedMessage))
		}

		fmt.Println("[INFO] Disconnected from server", serverAddressReadable)

		// Shutdown
		if err := unisockets.Shutdown(serverSocket, unisockets.SHUT_RDWR); err != nil {
			fmt.Printf("[ERROR] Could not shutdown socket %v, stopping: %v\n", serverAddressReadable, err)

			break
		}
	}
}
