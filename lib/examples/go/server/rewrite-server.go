package main

import (
	"fmt"
	"net"
)

func main() {
	tcpAddr, err := net.ResolveTCPAddr("tcp", "0.0.0.0:3333")
	if err != nil {
		fmt.Println(err)
	}

	ln, err := net.ListenTCP("tcp", tcpAddr)
	if err != nil {
		fmt.Println(err)
	}

	for {
		conn, err := ln.Accept()
		if err != nil {
			fmt.Println(err)
		}

		go handleConnection(conn)
	}
}

func handleConnection(conn net.Conn) {
	var input [512]byte

	n, err := conn.Read(input[0:])
	if err != nil {
		fmt.Println(err)
	}

	fmt.Println(string(input[0:n]))

}
