package main

import (
	"log"
	"math"
	"net"
)

func main() {

	tcpAddr, err := net.ResolveTCPAddr("tcp", "0.0.0.0:3333")
	checkError(err)

	conn, err := net.DialTCP("tcp", nil, tcpAddr)
	checkError(err)

	_, err = conn.Write([]byte(`{"inputArray": [1,1,3], "ionCount": 3, "myCount": 0}`))
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
