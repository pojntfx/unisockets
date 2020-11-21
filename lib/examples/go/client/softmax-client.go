package main

import (
	"encoding/json"
	"log"
	"math"
	"net"
)

type TCPClient struct {
	laddr string
}

type Sum struct {
	SumNum float64 `json:"sum"`
}

type Result struct {
	Result float64 `json:"result"`
}

type ReturningResult struct {
	Result []float64 `json:"result"`
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

	inputArray := decodeByteArray(buf, n)

	result := ignite(inputArray)

	byteArray := encodeByteArray(result)

	// Write sum
	_, err3 := conn.Write(byteArray)
	if err3 != nil {
		log.Fatal(err3)
	}

	var bufInputSum [512]byte

	// Read input, sum
	m, err := conn.Read(bufInputSum[0:])
	if err != nil {
		log.Fatal(err)
	}

	finalInputArray := decodeByteArray(bufInputSum, m)

	inputSum := decodeSum(bufInputSum, m)

	finalResult := igniteResult(finalInputArray, inputSum)

	finalByteArray := encodeFinalByteArray(finalResult)

	// Write result
	_, err4 := conn.Write(finalByteArray)
	if err4 != nil {
		log.Fatal(err3)
	}

	return nil
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

func encodeFinalByteArray(result ReturningResult) []byte {
	byteArray, err := json.Marshal(result)
	if err != nil {
		log.Fatal(err)
	}

	return byteArray
}

func ignite(inputArray []float64) Result {
	sum := 0.

	for i := 0; i < len(inputArray); i++ {
		sum = sum + softmaxSum(inputArray[i])
	}

	resultObj := Result{Result: sum}

	return resultObj
}

func igniteResult(inputArray []float64, sum float64) ReturningResult {
	finalresult := []float64{}

	for i := 0; i < len(inputArray); i++ {
		finalresult = append(finalresult, softmaxResult(sum, inputArray[i]))
	}

	resultObj := ReturningResult{Result: finalresult}

	return resultObj
}
