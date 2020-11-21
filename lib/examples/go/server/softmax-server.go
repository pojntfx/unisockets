package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net"
)

type Result struct {
	Result []float64 `json:"result"`
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

	defer conn.Close()

	for {
		//n, err := conn.Read(input[0:])
		_, err := conn.Read(input[0:])
		if err != nil {
			if err == io.EOF {
				break
			}
		}
		// inputArray := decodeByteArray(input, n)
		// We could allow different operations here
		// Then if server allows to start calculations

		_, err2 := conn.Write([]byte(`{"input": [1,1,3]}`))
		if err2 != nil {
			log.Fatal(err2)
		}
		if err == nil {
			break
		}
	}

	for {
		//n, err := conn.Read(input[0:])
		m, err := conn.Read(output[0:])
		if err != nil {
			if err == io.EOF {
				break
			}
		}
		// inputArray := decodeByteArray(input, n)
		// We could allow different operations here
		// Then if server allows to start calculations

		fmt.Println(string(output[0:m]))
	}

}

func softmaxSum(input float64) float64 {
	return math.Exp(input)
}

func softmaxResult(sum float64, input float64) float64 {
	return math.Exp(input) / sum
}

func decodeByteArray(input [512]byte, n int) []float64 {
	s := string(input[0:n])

	rawIn := json.RawMessage(s)

	bytes, err := rawIn.MarshalJSON()
	if err != nil {
		log.Fatal(err)
	}

	var p Numbers
	err = json.Unmarshal(bytes, &p)
	if err != nil {
		log.Fatal(err)
	}

	arr := p.SoftmaxArray
	return arr
}

func encodeByteArray(result Result) []byte {
	byteArray, err := json.Marshal(result)
	if err != nil {
		fmt.Println(err)
	}

	fmt.Println(string(byteArray))
	return byteArray
}

func ignite(inputArray []float64) Result {
	sum := 0.
	result := []float64{}

	for i := 0; i < len(inputArray); i++ {
		sum = sum + softmaxSum(inputArray[i])
	}

	for i := 0; i < len(inputArray); i++ {
		result = append(result, softmaxResult(sum, inputArray[i]))
	}

	fmt.Println(result)

	resultObj := Result{Result: result}
	return resultObj
}
