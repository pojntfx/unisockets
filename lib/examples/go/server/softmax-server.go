package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
)

type Result struct {
	Result []float64 `json:"result"`
}

type Sum struct {
	SumNum float64 `json:"result"`
}

type TCPServer struct {
	laddr string
}

type Numbers struct {
	SoftmaxArray []float64 `json:"input"`
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
	var input [512]byte
	var output [512]byte
	var result [512]byte

	defer conn.Close()

	for {
		// Establish connection to client
		_, err := conn.Read(input[0:])
		if err != nil {
			if err == io.EOF {
				break
			}
		}

		// Write input to Client
		_, err2 := conn.Write([]byte(`{"input": [1,1,3]}`))
		if err2 != nil {
			log.Fatal(err2)
		}
		if err == nil {
			break
		}
	}

	for {
		// Read sum result
		m, err := conn.Read(output[0:])
		if err != nil {
			if err == io.EOF {
				break
			}
		}

		inputSum := decodeSum(output, m)

		s := fmt.Sprintf("%f", inputSum)

		// Write input and sum for softmax calculation
		_, err2 := conn.Write([]byte(`{"input": [1,1,3], "sum": ` + s + `}`))
		if err2 != nil {
			log.Fatal(err2)
		}
		if err2 == nil {
			break
		}
	}

	for {
		// Read softmax result
		l, err := conn.Read(result[0:])
		if err != nil {
			if err == io.EOF {
				break
			}
		}

		fmt.Println(string(result[0:l]))
	}

}

func decodeSum(output [512]byte, m int) float64 {
	s := string(output[0:m])
	rawIn := json.RawMessage(s)

	bytes, err := rawIn.MarshalJSON()
	if err != nil {
		log.Fatal(err)
	}

	var p Sum

	err = json.Unmarshal(bytes, &p)
	if err != nil {
		log.Fatal(err)
	}

	res := p.SumNum

	return res
}
