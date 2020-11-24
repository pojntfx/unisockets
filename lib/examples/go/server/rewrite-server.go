package main

import (
	"fmt"
	"log"
	"net"
)

func main() {
	tcpAddr, err := net.ResolveTCPAddr("tcp", "0.0.0.0:3333")
	checkError(err)

	ln, err := net.ListenTCP("tcp", tcpAddr)
	checkError(err)

	for {
		conn, err := ln.Accept()
		checkError(err)

		go handleConnection(conn.(*net.TCPConn))
	}
}

func handleConnection(conn *net.TCPConn) {
	var input [512]byte

	n, err := conn.Read(input[0:])
	checkError(err)

	fmt.Println(string(input[0:n]))

}

func checkError(err error) {
	if err != nil {
		log.Fatal(err)
	}
}
