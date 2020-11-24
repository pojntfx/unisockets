package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
)

// DecodeJSONSumResult decodes JSON sum results
type DecodeJSONSumResult struct {
	SumResult []float64 `json:"sumResult"`
}

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

	_, err = conn.Write([]byte(`{"inputArray": [1,1,3], "ionCount": 3, "myCount": 0}`))
	checkError(err)

	n, err = conn.Read(input[0:])
	checkError(err)

	a := decodeJSONSumResult(string(input[0:n]))

	fmt.Println(a.SumResult)
}

func checkError(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func decodeJSONSumResult(input string) DecodeJSONSumResult {
	rawIn := json.RawMessage(input)

	bytes, err := rawIn.MarshalJSON()
	checkError(err)

	var d DecodeJSONSumResult

	err = json.Unmarshal(bytes, &d)
	checkError(err)

	return d
}

func encodeJSONSum() {}

func encodeJSONResult() {}

func decodeJSONResult() {}
