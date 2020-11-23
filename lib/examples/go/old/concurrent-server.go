package main

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"net"
	"os"

	"github.com/ugjka/messenger"
)

type TCPServer struct {
	laddr string
}

type Messenger struct {
	message string
}

var (
	count int
)

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

	m := messenger.New(0, false)

	go startCalc(m)

	for {
		conn, err := ln.Accept()
		if err != nil {
			log.Fatal(err)
		}
		count++
		go handleConnection(conn, count, m)
	}

}

func startCalc(m *messenger.Messenger) {
	for {
		reader := bufio.NewReader(os.Stdin)

		fmt.Println("Press ENTER to start calculation")
		username, _ := reader.ReadString('\n')
		fmt.Println(username)

		var i interface{}
		i = fmt.Sprintf("{ionCount: %v}", count)

		m.Broadcast(i)

		break
	}
}

func handleConnection(conn net.Conn, myCount int, m *messenger.Messenger) {
	var input [512]byte
	for {
		n, err := conn.Read(input[0:])
		if err != nil {
			if err == io.EOF {
				break
			}
		}

		fmt.Println(string(input[0:n]))

		data, err := m.Sub()

		msg := <-data

		fmt.Println(msg)

		_, err2 := conn.Write([]byte(msg.(string)))
		if err2 != nil {
			log.Fatal(err2)
		}
	}

}
