package main

import (
	"encoding/binary"
	"fmt"
	"os"

	"github.com/pojntfx/unisockets/pkg/unisockets"
)

var (
	LOCAL_HOST = []byte{127, 0, 0, 1}
)

const (
	LOCAL_PORT = 1234
	BACKLOG    = 1

	BUFFER_LENGTH = 1024
)

func main() {
	// Create address
	serverAddress := unisockets.SockaddrIn{
		SinFamily: unisockets.PF_INET,
		SinPort:   unisockets.Htons(LOCAL_PORT),
		SinAddr: struct{ SAddr uint32 }{
			SAddr: binary.LittleEndian.Uint32(LOCAL_HOST),
		},
	}
	serverAddressReadable := fmt.Sprintf("%v:%v", LOCAL_HOST, LOCAL_PORT)

	// Create socket
	serverSocket, err := unisockets.Socket(unisockets.PF_INET, unisockets.SOCK_STREAM, 0)
	if err != nil {
		fmt.Printf("[ERROR] Could not create socket %v: %v\n", serverAddressReadable, err)

		os.Exit(1)
	}

	// Bind
	if err := unisockets.Bind(serverSocket, &serverAddress); err != nil {
		fmt.Printf("[ERROR] Could not bind to socket %v: %v\n", serverAddressReadable, err)

		os.Exit(1)
	}

	// Listen
	if err := unisockets.Listen(serverSocket, BACKLOG); err != nil {
		fmt.Printf("[ERROR] Could not listen on socket %v: %v\n", serverAddressReadable, err)

		os.Exit(1)
	}

	fmt.Println("[INFO] Listening on", serverAddressReadable)

	// Accept loop
	for {
		fmt.Println("[DEBUG] Accepting on", serverAddressReadable)

		clientAddress := unisockets.SockaddrIn{}

		// Accept
		clientSocket, err := unisockets.Accept(serverSocket, &clientAddress)
		if err != nil {
			fmt.Println("[ERROR] Could not accept, continuing:", err)

			continue
		}

		go func(innerClientSocket int32, innerClientAddress unisockets.SockaddrIn) {
			clientHost := make([]byte, 4) // xxx.xxx.xxx.xxx
			binary.LittleEndian.PutUint32(clientHost, uint32(innerClientAddress.SinAddr.SAddr))

			clientAddressReadable := fmt.Sprintf("%v:%v", clientHost, innerClientAddress.SinPort)

			fmt.Println("[INFO] Accepted client", clientAddressReadable)

			// Receive loop
			for {
				fmt.Printf("[DEBUG] Waiting for client %v to send\n", clientAddressReadable)

				// Receive
				receivedMessage := make([]byte, BUFFER_LENGTH)

				receivedMessageLength, err := unisockets.Recv(innerClientSocket, &receivedMessage, BUFFER_LENGTH, 0)
				if err != nil {
					fmt.Printf("[ERROR] Could not receive from client %v, dropping message: %v\n", clientAddressReadable, err)

					continue
				}

				if receivedMessageLength == 0 {
					break
				}

				fmt.Printf("[DEBUG] Received %v bytes from %v\n", receivedMessageLength, clientAddressReadable)

				// Send
				sentMessage := []byte(fmt.Sprintf("You've sent: %v", string(receivedMessage)))

				sentMessageLength, err := unisockets.Send(innerClientSocket, sentMessage, 0)
				if err != nil {
					fmt.Printf("[ERROR] Could not send to client %v, dropping message: %v\n", clientAddressReadable, err)

					break
				}

				fmt.Printf("[DEBUG] Sent %v bytes to %v\n", sentMessageLength, clientAddressReadable)
			}

			fmt.Println("[INFO] Disconnected from client", clientAddressReadable)

			// Shutdown
			if err := unisockets.Shutdown(innerClientSocket, unisockets.SHUT_RDWR); err != nil {
				fmt.Printf("[ERROR] Could not shutdown client socket %v, stopping: %v\n", clientAddressReadable, err)

				return
			}
		}(clientSocket, clientAddress)
	}
}
