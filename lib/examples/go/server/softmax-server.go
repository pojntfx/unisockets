package main

import (
	"fmt"
	"io"
	"log"
	"net"
)

type TCPServer struct {
	laddr string
}

func main() {

	tcpServer := newTCPServer("0.0.0.0:3333")

	if err := tcpServer.open(); err != nil {
		log.Fatal(err)
	}
}

func newTCPServer(laddr string) *TCPServer {
	return &TCPServer{laddr}
}

func (s TCPServer) open() error {

	tcpAddr, err := net.ResolveTCPAddr("tcp", s.laddr)
	if err != nil {
		log.Fatal(err)
	}

	ln, err := net.ListenTCP("tcp", tcpAddr)
	if err != nil {
		log.Fatal(err)
	}

	for {
		conn, err := ln.Accept()
		if err != nil {
			log.Fatal(err)
		}

		go handleConnection(conn)
	}
}

func handleConnection(conn net.Conn) {
	var buf [512]byte

	defer conn.Close()

	for {
		n, err := conn.Read(buf[0:])

		if err != nil {
			if err == io.EOF {
				break
			}
		}

		fmt.Println(buf[0:n])

		_, err2 := conn.Write(buf[0:n])
		if err != nil {
			log.Fatal(err2)
		}
	}
}
