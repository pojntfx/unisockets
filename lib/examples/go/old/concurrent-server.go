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
	ionCount := 0
	//inputArray := [3]int{1, 1, 3}

	tcpAddr, err := net.ResolveTCPAddr("tcp", s.laddr)
	if err != nil {
		log.Fatal(err)
	}

	ln, err := net.ListenTCP("tcp", tcpAddr)
	if err != nil {
		log.Fatal(err)
	}

	m := messenger.New(0, false)

	//messages := make(chan string)

	go startCalc(m)

	for {
		conn, err := ln.Accept()
		if err != nil {
			log.Fatal(err)
		}

		ionCount++

		go handleConnection(conn, ionCount, m)
	}

}

func startCalc(m *messenger.Messenger) {
	for {
		reader := bufio.NewReader(os.Stdin)

		fmt.Println("Press ENTER to start calculation")
		username, _ := reader.ReadString('\n')
		fmt.Println(username)

		// Instead of printing username, take array of all users so far and put the information for each node to their channel
		// Code receiving channel

		// send jsonString with necessary information
		// Maybe just notify all goroutines and get the data from "public variables" afterwards
		//messages <- "Hi"

		var i interface{}
		i = "Hello World"

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

		// Print "Connected"
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
