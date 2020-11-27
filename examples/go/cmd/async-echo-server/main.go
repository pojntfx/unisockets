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
		log.Fatalf("[ERROR] Could not create socket %v:", serverAddressReadable, serverSocket)
	}

	// Bind
	if err := bind(serverSocket, &serverAddress); err == -1 {
		log.Fatalf("[ERROR] Could not bind socket %v:", serverAddressReadable, err)
	}

	// Listen
	if err := listen(serverSocket, BACKLOG); err == -1 {
		log.Fatalf("[ERROR] Could not listen on socket %v:", serverAddressReadable, err)
	}

	log.Println("[INFO] Listening on", serverAddressReadable)

	select {}
}
