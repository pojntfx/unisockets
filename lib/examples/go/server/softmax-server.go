package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
)

type Result struct {
	Result int `json:"result"`
}

type TCPServer struct {
	laddr string
}

type Numbers struct {
	SoftmaxArray []int `json:"input"`
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

	defer conn.Close()

	for {
		n, err := conn.Read(input[0:])

		if err != nil {
			if err == io.EOF {
				break
			}
		}

		arr := decodeByteArray(input, n)

		result := ignite(arr)

		byteArray := encodeByteArray(result)

		_, err2 := conn.Write(byteArray)
		if err2 != nil {
			log.Fatal(err2)
		}
	}
}

func softmaxSum(arr []int) int {

	sum := 0
	for i := 0; i < len(arr); i++ {
		sum = sum + arr[i]
	}

	return sum
}

func decodeByteArray(input [512]byte, n int) []int {
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

func ignite(arr []int) Result {
	result := Result{Result: softmaxSum(arr)}
	return result
}
