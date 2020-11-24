package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
)

type JSONSum struct {
	InputArray []float64 `json:"inputArray"`
	IonCount   int       `json:"ionCount"`
	MyCount    int       `json:"myCount"`
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

	a := encodeJSONSum(string(input[0:n]))
	fmt.Println(a.IonCount)

}

func checkError(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func encodeJSONSum(input string) JSONSum {
	rawIn := json.RawMessage(input)

	bytes, err := rawIn.MarshalJSON()
	checkError(err)

	var j JSONSum

	err = json.Unmarshal(bytes, &j)
	checkError(err)

	return j
}

func decodeJSONSum() {}

func encodeJSONResult() {}

func decodeJSONResult() {}
