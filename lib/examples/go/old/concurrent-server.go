package main

import (
	"bufio"
	"fmt"
	"io"
	"log"
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

var (
	count      int
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

	go startCalc(m)

	for {
		conn, err := ln.Accept()
		if err != nil {
			log.Fatal(err)
		}
		count++
		go handleConnection(conn, count, m)
	}

}

func startCalc(m *messenger.Messenger) {
	for {
		reader := bufio.NewReader(os.Stdin)

		fmt.Println("Press ENTER to start calculation")
		username, _ := reader.ReadString('\n')
		fmt.Println(username)

		var i interface{}
		i = fmt.Sprintf(`{"ionCount": %v, "inputArray": %v}`, count, inputArray)

		m.Broadcast(i)

		break
	}
}

func handleConnection(conn net.Conn, myCount int, m *messenger.Messenger) {
	var input [512]byte
	for {
		n, err := conn.Read(input[0:])
		if err != nil {
			if err == io.EOF {
				break
			}
		}

		fmt.Println(string(input[0:n]))

		data, err := m.Sub()

		msg := <-data

		fmt.Println(msg)

		// append myCount to Message
		// Convert string to json
		// create new json
		// rawIn := json.RawMessage(msg.(string))

		// bytes, err := rawIn.MarshalJSON()
		// if err != nil {
		// 	log.Fatal(err)
		// }

		// var j OutputJSON
		// err = json.Unmarshal(bytes, &j)
		// if err != nil {
		// 	log.Fatal(err)
		// }

		//ionCount := j.ionCount
		//inputArray := j.inputArray
		// myCount

		_, err2 := conn.Write([]byte(fmt.Sprintf(`{"ionCount": %v, "inputArray": %v, "myCount": %v}`, count, inputArray, myCount)))
		if err2 != nil {
			log.Fatal(err2)
		}
	}

}
