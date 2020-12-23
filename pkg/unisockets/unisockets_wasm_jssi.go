// +build js,wasm

package unisockets

import (
	"fmt"
	"syscall/js"
	"unsafe"
)

// TODO: Get this to work with TinyGo WASM/JS

var (
	jssiImports = js.Global().Get("jssiImports")
)

const (
	PF_INET     = 2
	SOCK_STREAM = 1
	SHUT_RDWR   = 2
)

func Socket(socketDomain int32, socketType int32, socketProtocol int32) (int32, error) {
	rvChan := make(chan int32)

	go jssiImports.Call("unisockets_socket", socketDomain, socketType, socketProtocol).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		rvChan <- int32(args[0].Int())

		return nil
	}))

	rv := <-rvChan
	if rv == -1 {
		return rv, fmt.Errorf("could not create socket, error code %v", rv)
	}

	return rv, nil
}

func Bind(socketFd int32, socketAddr *SockaddrIn) error {
	rvChan := make(chan int32)

	go jssiImports.Call("unisockets_bind", socketFd, unsafe.Pointer(socketAddr), uint32(unsafe.Sizeof(socketAddr))).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		rvChan <- int32(args[0].Int())

		return nil
	}))

	rv := <-rvChan
	if rv == -1 {
		return fmt.Errorf("could not bind socket, error code %v", rv)
	}

	return nil
}

func Listen(socketFd int32, socketBacklog int32) error {
	rvChan := make(chan int32)

	go jssiImports.Call("unisockets_listen", socketFd, socketBacklog).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		rvChan <- int32(args[0].Int())

		return nil
	}))

	rv := <-rvChan
	if rv == -1 {
		return fmt.Errorf("could not listen on socket, error code %v", rv)
	}

	return nil
}

func Accept(socketFd int32, socketAddr *SockaddrIn) (int32, error) {
	rvChan := make(chan int32)

	socketAddressLength := uint32(unsafe.Sizeof(socketAddr))

	go jssiImports.Call("unisockets_accept", socketFd, unsafe.Pointer(socketAddr), unsafe.Pointer(&socketAddressLength)).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		rvChan <- int32(args[0].Int())

		return nil
	}))

	rv := <-rvChan
	if rv == -1 {
		return rv, fmt.Errorf("could not accept on socket, error code %v", rv)
	}

	return rv, nil
}

func Recv(socketFd int32, socketReceivedMessage *[]byte, socketBufferLength uint32, socketFlags int32) (int32, error) {
	rvChan := make(chan int32)

	go jssiImports.Call("unisockets_recv", socketFd, unsafe.Pointer(&(*socketReceivedMessage)[0]), socketBufferLength, socketFlags).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		rvChan <- int32(args[0].Int())

		return nil
	}))

	rv := <-rvChan

	if rv == -1 {
		return rv, fmt.Errorf("could not receive from socket, error code %v", rv)
	}

	return rv, nil
}

func Send(socketFd int32, socketMessageToSend []byte, socketFlags int32) (int32, error) {
	rvChan := make(chan int32)

	go jssiImports.Call("unisockets_send", socketFd, unsafe.Pointer(&socketMessageToSend[0]), uint32(len(socketMessageToSend)), socketFlags).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		rvChan <- int32(args[0].Int())

		return nil
	}))

	rv := <-rvChan

	if rv == -1 {
		return rv, fmt.Errorf("could not send from socket, error code %v", rv)
	}

	return rv, nil
}

func Shutdown(socketFd int32, socketFlags int32) error {
	// Not necessary on WASM

	return nil
}

func Connect(socketFd int32, socketAddr *SockaddrIn) error {
	rvChan := make(chan int32)

	go jssiImports.Call("unisockets_connect", socketFd, unsafe.Pointer(socketAddr), uint32(unsafe.Sizeof(socketAddr))).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		rvChan <- int32(args[0].Int())

		return nil
	}))

	rv := <-rvChan
	if rv == -1 {
		return fmt.Errorf("could not connect to socket, error code %v", rv)
	}

	return nil
}

func Htons(v uint16) uint16 {
	return (v >> 8) | (v << 8)
}
