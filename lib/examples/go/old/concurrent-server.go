package main

import (
	"bufio"
	"encoding/json"
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

type OutputJSON struct {
	ionCount   int       `json:"ionCount"`
	inputArray []float64 `json:"inputArray"`
}

type InputJSON struct {
	IonCount   int
	InputArray []float64
	MyCount    int
}

var (
	count      int
	inputArray []float64
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

	inputArray = []float64{1, 1, 3}

	go startCalc(m)

	for {
		conn, err := ln.Accept()
		if err != nil {
			log.Fatal(err)
		}

		go handleConnection(conn, count, m)

		count++
	}

}

func startCalc(m *messenger.Messenger) {
	for {
		reader := bufio.NewReader(os.Stdin)

		fmt.Println("Press ENTER to start calculation")
		username, _ := reader.ReadString('\n')
		_ = username
		var i interface{}
		i = fmt.Sprintf(`{"ionCount": %v, "inputArray": %v}`, count, inputArray)

		m.Broadcast(i)

		break
	}
}

func handleConnection(conn net.Conn, myCount int, m *messenger.Messenger) {
	var input [512]byte
	for {
		_, err := conn.Read(input[0:])
		if err != nil {
			if err == io.EOF {
				break
			}
		}

		data, err := m.Sub()

		msg := <-data
		_ = msg

		res := InputJSON{count, inputArray, myCount}

		bytes, err := json.Marshal(res)
		if err != nil {
			log.Fatal(err)
		}

		_, err2 := conn.Write(bytes)
		if err2 != nil {
			log.Fatal(err2)
		}
	}

}
