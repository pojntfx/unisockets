package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net"
)

type TCPClient struct {
	laddr string
}

type JSONInput struct {
	IonCount   int       `json:"ionCount"`
	InputArray []float64 `json:"inputArray"`
	MyCount    int       `json:"myCount"`
}

func main() {
	tcpClient := NewTCPClient("0.0.0.0:3333")

	if err := tcpClient.Open(); err != nil {
		log.Fatal("could not open tcpClient", err)
	}
}

func NewTCPClient(laddr string) *TCPClient {
	return &TCPClient{laddr}
}

func (s *TCPClient) Open() error {

	tcpAddr, err := net.ResolveTCPAddr("tcp", s.laddr)
	if err != nil {
		log.Fatal(err)
	}

	conn, err := net.DialTCP("tcp", nil, tcpAddr)
	if err != nil {
		log.Fatal(err)
	}

	// Connect to server
	_, err2 := conn.Write([]byte(`Connected`))
	if err != nil {
		log.Fatal(err2)
	}

	var buf [512]byte

	// Read input values
	n, err := conn.Read(buf[0:])
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(string(buf[0:n]))

	// Here we have the string with the json
	rawIn := json.RawMessage(string(buf[0:n]))

	bytes, err := rawIn.MarshalJSON()
	if err != nil {
		log.Fatal(err)
	}
	// Hier drunter ist ein Error
	var j JSONInput
	err = json.Unmarshal(bytes, &j)
	if err != nil {
		log.Fatal(err)
	}

	var result []float64
	// Got access to all values now
	for i := int(math.Ceil(float64(len(j.InputArray))/float64(j.IonCount))) * j.MyCount; i < int(math.Ceil(float64(len(j.InputArray))/float64(j.IonCount)))*j.MyCount+int(math.Ceil(float64(len(j.InputArray))/float64(j.IonCount))) && i < len(j.InputArray); i++ {

		result = append(result, softmaxSum(j.InputArray[i]))
	}

	fmt.Println(result)
	return nil
}

func softmaxSum(input float64) float64 {
	return math.Exp(input)
}
