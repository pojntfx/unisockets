package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net"
	"os"
	"sync"

	"github.com/ugjka/messenger"
)

// DecodeJSONSumResult decodes JSON sum results
type DecodeJSONSumResult struct {
	SumResult []float64 `json:"sumResult"`
	MyCount   int       `json:"myCount"`
}

// EncodeJSONSumInput encodes JSON sum input
type EncodeJSONSumInput struct {
	InputArray []float64 `json:"inputArray"`
	IonCount   int       `json:"ionCount"`
	MyCount    int       `json:"myCount"`
}

// EncodeJSONSoftmaxInput encodes JSON softmax input
type EncodeJSONSoftmaxInput struct {
	InputArray []float64 `json:"inputArray"`
	IonCount   int       `json:"ionCount"`
	MyCount    int       `json:"myCount"`
	Sum        int       `json:"sum"`
}

// DecodeJSONSoftmaxResult decodes JSON softmax result
type DecodeJSONSoftmaxResult struct {
	SoftmaxResult []float64 `json:"softmaxResult"`
	MyCount       int       `json:"myCount"`
}

var (
	ionCount           int
	sumResultArray     []float64
	softmaxResultArray []float64
	sumResult          float64
	inputArray         []float64
)

func main() {

	tcpAddr, err := net.ResolveTCPAddr("tcp", "0.0.0.0:3333")
	checkError(err)

	ln, err := net.ListenTCP("tcp", tcpAddr)
	checkError(err)

	mSum := messenger.New(0, false)
	mSoftmax := messenger.New(0, false)

	inputArray = []float64{1, 1, 3}

	var wgSum sync.WaitGroup
	var wgSoftmax sync.WaitGroup

	wgSum.Add(1)
	wgSoftmax.Add(1)

	sumResultArray = make([]float64, len(inputArray))
	softmaxResultArray = make([]float64, len(inputArray))

	go manager(mSum, mSoftmax, &wgSum, &wgSoftmax)

	for {
		conn, err := ln.Accept()
		checkError(err)

		// Hier wurde die wg noch nicht initialized
		go handleConnection(conn.(*net.TCPConn), ionCount, mSum, mSoftmax, &wgSum, &wgSoftmax)

		ionCount++
	}
}

func manager(mSum *messenger.Messenger, mSoftmax *messenger.Messenger, wgS *sync.WaitGroup, wgSm *sync.WaitGroup) {

	reader := bufio.NewReader(os.Stdin)

	fmt.Println("[INFO] Press ENTER to start calculation")
	input, _ := reader.ReadString('\n')
	_ = input

	//wgS.Add(ionCount)

	var i interface{}
	mSum.Broadcast(i)

	wgS.Wait()

	for i := 0; i < len(sumResultArray); i++ {
		sumResult = sumResultArray[i]
	}

	fmt.Println(sumResult)

	//wgSm.Add(ionCount)

	mSoftmax.Broadcast(i)

	wgSm.Wait()

	fmt.Println(softmaxResultArray)
}

func handleConnection(conn *net.TCPConn, ionCount int, mSum *messenger.Messenger, mSoftmax *messenger.Messenger, wgS2 *sync.WaitGroup, wgSm2 *sync.WaitGroup) {
	var input [512]byte

	n, err := conn.Read(input[0:])
	checkError(err)

	fmt.Println(string(input[0:n]))

	start, err := mSum.Sub()
	_ = start

	bytes := encodeJSONSumInput(EncodeJSONSumInput{inputArray, 1, 0})

	_, err = conn.Write(bytes)
	checkError(err)

	n, err = conn.Read(input[0:])
	checkError(err)

	sumResultChunk := decodeJSONSumResult(string(input[0:n]))

	fmt.Println(sumResultChunk.SumResult)

	for i := 0; i < len(sumResultChunk.SumResult); i++ {
		sumResultArray[i+(int(math.Ceil(float64(len(inputArray))/float64(ionCount)))*sumResultChunk.MyCount)] = sumResultChunk.SumResult[i]
	}

	// Hier ist der Uebeltaeter
	wgS2.Done()

	start, err = mSoftmax.Sub()
	_ = start

	bytes2 := encodeJSONSoftmaxInput(EncodeJSONSoftmaxInput{inputArray, 1, 0, 25})

	_, err = conn.Write(bytes2)
	checkError(err)

	o, err := conn.Read(input[0:])
	checkError(err)

	softmaxResultChunk := decodeJSONSoftmaxResult(string(input[0:o]))

	fmt.Println(softmaxResultChunk.SoftmaxResult)

	for i := 0; i < len(softmaxResultChunk.SoftmaxResult); i++ {
		softmaxResultArray[i+(int(math.Ceil(float64(len(inputArray))/float64(ionCount)))*softmaxResultChunk.MyCount)] = softmaxResultChunk.SoftmaxResult[i]
	}

	wgSm2.Done()

	fmt.Println(sumResultChunk.SumResult)
	fmt.Println(softmaxResultChunk.SoftmaxResult)
}

func checkError(err error) {
	if err != nil {
		log.Fatal(err)
	}
}

func decodeJSONSumResult(input string) DecodeJSONSumResult {
	rawIn := json.RawMessage(input)

	bytes, err := rawIn.MarshalJSON()
	checkError(err)

	var d DecodeJSONSumResult

	err = json.Unmarshal(bytes, &d)
	checkError(err)

	return d
}

func encodeJSONSumInput(s EncodeJSONSumInput) []byte {

	bytes, err := json.Marshal(s)
	checkError(err)

	return bytes
}

func encodeJSONSoftmaxInput(s EncodeJSONSoftmaxInput) []byte {

	bytes, err := json.Marshal(s)
	checkError(err)

	return bytes
}

func decodeJSONSoftmaxResult(input string) DecodeJSONSoftmaxResult {

	rawIn := json.RawMessage(input)

	bytes, err := rawIn.MarshalJSON()
	checkError(err)

	var d DecodeJSONSoftmaxResult

	err = json.Unmarshal(bytes, &d)
	checkError(err)

	return d
}
