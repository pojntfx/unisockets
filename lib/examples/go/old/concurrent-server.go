package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math"
	"net"
	"os"

	"github.com/ugjka/messenger"
)

type TCPServer struct {
	laddr string
}

type Messenger struct {
	message string
}

type OutputJSON struct {
	ionCount   int       `json:"ionCount"`
	inputArray []float64 `json:"inputArray"`
}

type InputJSON struct {
	IonCount   int
	InputArray []float64
	MyCount    int
}

type SumResults struct {
	Result  []float64
	MyCount int
}

type WriteSum struct {
	ResultSum  float64   `json:"resultSum"`
	MyCount    int       `json:"myCount"`
	InputArray []float64 `json:"inputArray"`
	IonCount   int       `json:"ionCount"`
}

var (
	count      int
	resultSum  []float64
	inputArray []float64
)

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

	m := messenger.New(0, false)

	inputArray = []float64{1, 1, 3}

	resultSum = make([]float64, len(inputArray))

	go startCalc(m)

	for {
		conn, err := ln.Accept()
		if err != nil {
			log.Fatal(err)
		}

		go handleConnection(conn, count, m)

		count++
	}

}

func startCalc(m *messenger.Messenger) {
	for {
		reader := bufio.NewReader(os.Stdin)

		fmt.Println("Press ENTER to start calculation")
		username, _ := reader.ReadString('\n')
		_ = username
		var i interface{}
		i = fmt.Sprintf(`{"ionCount": %v, "inputArray": %v}`, count, inputArray)

		m.Broadcast(i)

		break
	}
}

func handleConnection(conn net.Conn, myCount int, m *messenger.Messenger) {
	var input [512]byte
	var inputSum [512]byte
	var finalResult [512]byte

	for {
		_, err := conn.Read(input[0:])
		if err != nil {
			if err == io.EOF {
				break
			}
		}

		data, err := m.Sub()

		msg := <-data
		_ = msg

		res := InputJSON{count, inputArray, myCount}

		bytes, err := json.Marshal(res)
		if err != nil {
			log.Fatal(err)
		}

		_, err2 := conn.Write(bytes)
		if err2 != nil {
			log.Fatal(err2)
		}

		n, err := conn.Read(inputSum[0:])
		if err != nil {
			if err == io.EOF {
				break
			}
		}

		var l SumResults
		err = json.Unmarshal(inputSum[0:n], &l)
		if err != nil {
			log.Fatal(err)
		}

		for i := 0; i < len(l.Result); i++ {
			resultSum[i+(int(math.Ceil(float64(len(inputArray))/float64(count)))*myCount)] = l.Result[i]
		}

		fmt.Println(resultSum)
		// Drueber loopen und Summe addieren
		sum := 0.

		for i := 0; i < len(resultSum); i++ {
			sum += resultSum[i]
		}

		// Send resultSum and myCount to client
		res2 := WriteSum{sum, myCount, inputArray, count}

		bytes2, err4 := json.Marshal(res2)
		if err4 != nil {
			log.Fatal(err)
		}

		_, err3 := conn.Write(bytes2)
		if err3 != nil {
			log.Fatal(err2)
		}

		y, err := conn.Read(finalResult[0:])
		if err != nil {
			if err == io.EOF {
				break
			}
		}

		fmt.Println(string(finalResult[0:y]))

	}

}
