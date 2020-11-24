package main

import (
	"log"
	"net"
)

func main() {

	tcpAddr, err := net.ResolveTCPAddr("tcp", "0.0.0.0:3333")
	if err != nil {
		log.Fatal(err)
	}

	conn, err := net.DialTCP("tcp", nil, tcpAddr)
	if err != nil {
		log.Fatal(err)
	}

	_, err2 := conn.Write([]byte("Connected"))
	if err2 != nil {
		log.Fatal(err)
	}
}
