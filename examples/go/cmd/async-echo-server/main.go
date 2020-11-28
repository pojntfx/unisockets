package main

import (
	"encoding/binary"
	"fmt"
	"log"
	"syscall/js"
	"unsafe"
)

var (
	LOCAL_HOST = []byte{10, 0, 0, 240}
)

const (
	LOCAL_PORT = 1234
	BACKLOG    = 1

	RECEIVED_MESSAGE_MAX_LENGTH = 1024
)

var (
	berkeley_sockets = js.Global().Get("berkeleySockets")
)

const (
	PF_INET     = 2
	SOCK_STREAM = 1
)

type sockaddrIn struct {
	sinFamily uint16
	sinPort   uint16
	sinAddr   struct {
		sAddr uint32
	}
}

func socket(socketDomain int32, socketType int32, socketProtocol int32) int32 {
	rvChan := make(chan int32)

	go berkeley_sockets.Call("berkeley_sockets_socket", socketDomain, socketType, socketProtocol).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		rvChan <- int32(args[0].Int())

		return nil
	}))

	rv := <-rvChan

	return rv
}

func bind(socketFd int32, socketAddr *sockaddrIn) int32 {
	rvChan := make(chan int32)

	go berkeley_sockets.Call("berkeley_sockets_bind", socketFd, unsafe.Pointer(socketAddr), uint32(unsafe.Sizeof(socketAddr))).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		rvChan <- int32(args[0].Int())

		return nil
	}))

	rv := <-rvChan

	return rv
}

func listen(socketFd int32, backlog int32) int32 {
	rvChan := make(chan int32)

	go berkeley_sockets.Call("berkeley_sockets_listen", socketFd, backlog).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		rvChan <- int32(args[0].Int())

		return nil
	}))

	rv := <-rvChan

	return rv
}

func accept(socketFd int32, socketAddr *sockaddrIn) int32 {
	rvChan := make(chan int32)

	socketAddressLength := uint32(unsafe.Sizeof(socketAddr))

	go berkeley_sockets.Call("berkeley_sockets_accept", socketFd, unsafe.Pointer(socketAddr), unsafe.Pointer(&socketAddressLength)).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		rvChan <- int32(args[0].Int())

		return nil
	}))

	rv := <-rvChan

	return rv
}

func recv(socketFd int32, receivedMessage *[]byte, receivedMessageLength uint32, flags int32) int32 {
	rvChan := make(chan int32)

	go berkeley_sockets.Call("berkeley_sockets_recv", socketFd, unsafe.Pointer(receivedMessage), receivedMessageLength, flags).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		rvChan <- int32(args[0].Int())

		return nil
	}))

	rv := <-rvChan

	return rv
}

func send(socketFd int32, sentMessage *[]byte, flags int32) int32 {
	rvChan := make(chan int32)

	go berkeley_sockets.Call("berkeley_sockets_send", socketFd, unsafe.Pointer(sentMessage), uint32(len(*sentMessage)), flags).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		rvChan <- int32(args[0].Int())

		return nil
	}))

	rv := <-rvChan

	return rv
}

func htons(v uint16) uint16 {
	return (v >> 8) | (v << 8)
}

func main() {
	// Create address
	serverAddress := sockaddrIn{
		sinFamily: PF_INET,
		sinPort:   htons(LOCAL_PORT),
		sinAddr: struct{ sAddr uint32 }{
			sAddr: uint32(binary.LittleEndian.Uint32(LOCAL_HOST)),
		},
	}
	serverAddressReadable := fmt.Sprintf("%v:%v", LOCAL_HOST, LOCAL_PORT)

	// Create socket
	serverSocket := socket(PF_INET, SOCK_STREAM, 0)
	if serverSocket == -1 {
		log.Fatalf("[ERROR] Could not create socket %v: %v\n", serverAddressReadable, serverSocket)
	}

	// Bind
	if err := bind(serverSocket, &serverAddress); err == -1 {
		log.Fatalf("[ERROR] Could not bind socket %v: %v\n", serverAddressReadable, err)
	}

	// Listen
	if err := listen(serverSocket, BACKLOG); err == -1 {
		log.Fatalf("[ERROR] Could not listen on socket %v: %v\n", serverAddressReadable, err)
	}

	log.Println("[INFO] Listening on", serverAddressReadable)

	// Accept loop
	for {
		log.Println("[DEBUG] Accepting on", serverAddressReadable)

		clientAddress := sockaddrIn{}

		// Accept
		clientSocket := accept(serverSocket, &clientAddress)
		if clientSocket == -1 {
			log.Println("[ERROR] Could not accept, continuing:", clientSocket)

			continue
		}

		go func(innerClientSocket int32, innerClientAddress sockaddrIn) {
			clientHost := make([]byte, 4) // xxx.xxx.xxx.xxx
			binary.LittleEndian.PutUint32(clientHost, uint32(innerClientAddress.sinAddr.sAddr))

			clientAddressReadable := fmt.Sprintf("%v:%v", clientHost, innerClientAddress.sinPort)

			log.Println("[INFO] Accepted client", clientAddressReadable)

			// Receive loop
			for {
				log.Printf("[DEBUG] Waiting for client %v to send\n", clientAddressReadable)

				// Receive
				receivedMessage := make([]byte, RECEIVED_MESSAGE_MAX_LENGTH)

				receivedMessageLength := recv(innerClientSocket, &receivedMessage, RECEIVED_MESSAGE_MAX_LENGTH, 0)
				if receivedMessageLength == -1 {
					log.Printf("[ERROR] Could not receive from client %v, dropping message: %v\n", clientAddressReadable, receivedMessageLength)

					continue
				}

				if receivedMessageLength == 0 {
					break
				}

				log.Printf("[DEBUG] Received %v bytes from %v\n", receivedMessageLength, clientAddressReadable)

				// Send
				sentMessage := []byte(fmt.Sprintf("You've sent: %v", "Yeah!")) // TODO: Access the received message here

				sentMessageLength := send(innerClientSocket, &sentMessage, 0)
				if sentMessageLength == -1 {
					log.Printf("[ERROR] Could not send to client %v, dropping message: %v\n", clientAddressReadable, sentMessageLength)

					return
				}

				log.Printf("[DEBUG] Sent %v bytes to %v\n", sentMessageLength, clientAddressReadable)
			}
		}(clientSocket, clientAddress)
	}
}
