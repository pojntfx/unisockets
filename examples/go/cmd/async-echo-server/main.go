package main

import (
	"log"
	"syscall/js"
)

var (
	berkeley_sockets = js.Global().Get("berkeleySockets")
)

const (
	PF_INET     = 2
	SOCK_STREAM = 1
)

func socket(socketDomain int, socketType int, socketProtocol int) int {
	rvChan := make(chan int)

	go berkeley_sockets.Call("berkeley_sockets_socket", socketDomain, socketType, socketProtocol).Call("then", js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		rvChan <- args[0].Int()

		return nil
	}))

	rv := <-rvChan

	return rv
}

func main() {
	// Create address
	serverSocket := socket(PF_INET, SOCK_STREAM, 0)
	if serverSocket == -1 {
		log.Fatal("[ERROR] Could not create socket:", serverSocket)
	}

	log.Println("fd", serverSocket)

	select {}
}
