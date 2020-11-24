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

type JSONOutput struct {
	Result  []float64 `json:"result"`
	MyCount int       `json:"myCount"`
}

type InputSum struct {
	Result     float64   `json:"resultSum"`
	MyCount    int       `json:"myCount"`
	InputArray []float64 `json:"inputArray"`
	IonCount   int       `json:"IonCount`
}

type FinalOutput struct {
	FinalResult []float64 `json:"finalResult"`
	MyCount     int       `json:"myCount"`
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
	// Send that Array back to server with myCount
	res := JSONOutput{result, j.MyCount}

	bytes2, err := json.Marshal(res)
	if err != nil {
		log.Fatal(err)
	}

	_, err3 := conn.Write(bytes2)
	if err3 != nil {
		log.Fatal(err2)
	}

	var buf2 [512]byte
	l, err4 := conn.Read(buf2[0:])
	if err4 != nil {
		log.Fatal(err)
	}

	fmt.Println(string(buf2[0:l]))

	rawIn2 := json.RawMessage(string(buf2[0:l]))

	bytes3, err := rawIn2.MarshalJSON()
	if err != nil {
		log.Fatal(err)
	}
	// Hier drunter ist ein Error
	var o InputSum
	err = json.Unmarshal(bytes3, &o)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(o.Result)
	fmt.Println(o.MyCount)
	fmt.Println(o.InputArray)
	fmt.Println(o.IonCount)
	// Wir haben zugriff auf alle variablen. Nun wieder berechnen und zuruecksenden.

	// Now we have all the necessary Data, calculate the values from our part and send back the values and myCount

	var finalResult []float64

	for i := int(math.Ceil(float64(len(o.InputArray))/float64(o.IonCount))) * o.MyCount; i < int(math.Ceil(float64(len(o.InputArray))/float64(o.IonCount)))*o.MyCount+int(math.Ceil(float64(len(o.InputArray))/float64(o.IonCount))) && i < len(o.InputArray); i++ {

		finalResult = append(finalResult, softmaxResult(o.Result, o.InputArray[i]))
	}

	fmt.Println(finalResult)
	// Send that Array back to server with myCount
	res3 := FinalOutput{finalResult, o.MyCount}

	bytes3, err6 := json.Marshal(res3)
	if err6 != nil {
		log.Fatal(err6)
	}

	_, err7 := conn.Write(bytes3)
	if err7 != nil {
		log.Fatal(err7)
	}

	return nil
}

func softmaxSum(input float64) float64 {
	return math.Exp(input)
}

func softmaxResult(sum float64, input float64) float64 {
	return math.Exp(input) / sum
}
