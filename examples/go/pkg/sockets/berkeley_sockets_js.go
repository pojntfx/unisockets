// +build js,wasm

package sockets

import (
	"fmt"
	"syscall/js"
	"unsafe"
)

var (
	berkeley_sockets = js.Global().Get("berkeleySockets")
)

const (
	PF_INET     = 2
	SOCK_STREAM = 1
	SHUT_RDWR   = 2
)

func Socket(socketDomain int32, socketType int32, socketProtocol int32) (int32, error) {
	rvChan := make(chan int32)

	go berkeley_sockets.Call("berkeley_sockets_socket", socketDomain, socketType, socketProtocol).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
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

	go berkeley_sockets.Call("berkeley_sockets_bind", socketFd, unsafe.Pointer(socketAddr), uint32(unsafe.Sizeof(socketAddr))).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
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

	go berkeley_sockets.Call("berkeley_sockets_listen", socketFd, socketBacklog).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
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

	go berkeley_sockets.Call("berkeley_sockets_accept", socketFd, unsafe.Pointer(socketAddr), unsafe.Pointer(&socketAddressLength)).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
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

	go berkeley_sockets.Call("berkeley_sockets_recv", socketFd, unsafe.Pointer(&(*socketReceivedMessage)[0]), socketBufferLength, socketFlags).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
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

	go berkeley_sockets.Call("berkeley_sockets_send", socketFd, unsafe.Pointer(&socketMessageToSend[0]), uint32(len(socketMessageToSend)), socketFlags).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		rvChan <- int32(args[0].Int())

		return nil
	}))

	rv := <-rvChan

	if rv == -1 {
		return rv, fmt.Errorf("could not send from socket, error code %v", rv)
	}

	return rv, nil
}

func Shutdown(socketFd int32, socketFlags int32) (int32, error) {
	// Not necessary on WASM

	return 0, nil
}

func Htons(v uint16) uint16 {
	return (v >> 8) | (v << 8)
}
