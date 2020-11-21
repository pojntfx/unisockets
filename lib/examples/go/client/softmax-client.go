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
	tcpClient := NewTCPClient("0.0.0.0:3333")

	if err := tcpClient.Open(); err != nil {
		log.Fatal("could not open tcpClient", err)
	}
}

func NewTCPClient(laddr string) *TCPClient {
	return &TCPClient{laddr}
}

func (s *TCPClient) Open() error {
	//var input [512]byte

	tcpAddr, err := net.ResolveTCPAddr("tcp", s.laddr)
	if err != nil {
		log.Fatal(err)
	}

	conn, err := net.DialTCP("tcp", nil, tcpAddr)
	if err != nil {
		log.Fatal(err)
	}

	_, err2 := conn.Write([]byte(`Connected`))
	if err != nil {
		log.Fatal(err2)
	}

	var buf [512]byte

	n, err := conn.Read(buf[0:])
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(string(buf[0:n]))
	// Also bis hier gehts dann kommt ein Invalid character irgendwo
	// Wo kommt das n her?
	inputArray := decodeByteArray(buf, n)

	//calculate for each element seperately

	result := ignite(inputArray)

	byteArray := encodeByteArray(result)

	// Der Client rechnet, das Ergebnis muss beim Server ankommen
	//fmt.Println(string(byteArray))
	_, err3 := conn.Write(byteArray)
	if err3 != nil {
		log.Fatal(err2)
	}
	fmt.Println("Solution successfully sent!")
	return nil
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
		log.Fatal(err)
	}

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

	resultObj := Result{Result: result}
	return resultObj
}
