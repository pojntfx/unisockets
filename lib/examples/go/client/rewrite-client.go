package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net"
)

// DecodeJSONSumInput decodes JSON sum input
type DecodeJSONSumInput struct {
	InputArray []float64 `json:"inputArray"`
	IonCount   int       `json:"ionCount"`
	MyCount    int       `json:"myCount"`
}

func main() {
	var jsonSumInput [512]byte

	tcpAddr, err := net.ResolveTCPAddr("tcp", "0.0.0.0:3333")
	checkError(err)

	conn, err := net.DialTCP("tcp", nil, tcpAddr)
	checkError(err)

	_, err = conn.Write([]byte(`Connected`))
	checkError(err)

	n, err := conn.Read(jsonSumInput[0:])
	checkError(err)

	a := decodeJSONSumInput(string(jsonSumInput[0:n]))

	fmt.Println(a.IonCount)

	// process

	_, err = conn.Write([]byte(`{"sumResult": [2.7, 2.7, 20.0]}`))
	checkError(err)

}

func softmaxSum(input float64) float64 {
	return math.Exp(input)
}

func softmaxResult(sum float64, input float64) float64 {
	return math.Exp(input) / sum
}

func checkError(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func decodeJSONSumInput(input string) DecodeJSONSumInput {
	rawIn := json.RawMessage(input)

	bytes, err := rawIn.MarshalJSON()
	checkError(err)

	var d DecodeJSONSumInput

	err = json.Unmarshal(bytes, &d)
	checkError(err)

	return d
}
