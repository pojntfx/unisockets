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

// EncodeJSONSumResult encodes JSON sum result
type EncodeJSONSumResult struct {
	SumResult []float64 `json:"sumResult"`
	MyCount   int       `json:"myCount"`
}

type DecodeJSONSoftmaxInput struct {
	InputArray []float64 `json:"inputArray"`
	IonCount   int       `json:"ionCount"`
	MyCount    int       `json:"myCount"`
	Sum        int       `json:"sum"`
}

type EncodeJSONSoftmaxResult struct {
	SoftmaxResult []float64 `json:"softmaxResult"`
	MyCount       int       `json:"myCount"`
}

func main() {
	var jsonSumInput [512]byte
	var jsonSoftmaxInput [512]byte
	var jsonSumResult = []float64{2.7, 2.7, 20.0}

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

	// process incoming values and set the value in EncodeJSONSumResults

	bytes := encodeJSONSumResult(EncodeJSONSumResult{jsonSumResult, 0})

	fmt.Println(string(bytes))

	_, err = conn.Write(bytes)
	checkError(err)

	// Read actual jsonSoftmaxInput
	//jsonSoftmaxInput := `{"inputArray": [1,1,3], "ionCount": 3, "myCount": 0, "sum": 25}`
	o, err := conn.Read(jsonSoftmaxInput[0:])
	checkError(err)

	b := decodeJSONSoftmaxInput(string(jsonSoftmaxInput[0:o]))

	fmt.Println(b.InputArray)

	//  calculate jsonSoftmaxResult

	var jsonSoftmaxResult = []float64{0.1, 0.1, 0.78}

	bytes2 := encodeJSONSoftmaxResult(EncodeJSONSoftmaxResult{jsonSoftmaxResult, 0})

	_, err = conn.Write(bytes2)
	checkError(err)

	fmt.Println(string(bytes2))
	fmt.Println(b)
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

func encodeJSONSumResult(s EncodeJSONSumResult) []byte {

	bytes, err := json.Marshal(s)
	checkError(err)

	return bytes
}

func decodeJSONSoftmaxInput(input string) DecodeJSONSoftmaxInput {

	rawIn := json.RawMessage(input)

	bytes, err := rawIn.MarshalJSON()
	checkError(err)

	var d DecodeJSONSoftmaxInput

	err = json.Unmarshal(bytes, &d)
	checkError(err)

	return d
}

func encodeJSONSoftmaxResult(s EncodeJSONSoftmaxResult) []byte {

	bytes, err := json.Marshal(s)
	checkError(err)

	return bytes
}
