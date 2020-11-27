package main

import (
	"fmt"
	"sync"
	"time"
)

var (
	acceptChan   = make(chan int)
	receiveChans = make(map[int]chan int)
)

var receiveChanLock sync.Mutex

func triggerAccept()

func triggerReceive(fd int)

//export resolveAccept
func resolveAccept(fd int) {
	go func(innerFd int) {
		acceptChan <- innerFd
	}(fd)
}

//export resolveReceive
func resolveReceive(fd int, msg int) {
	go func(innerFd int) {
		matchingChan, ok := receiveChans[innerFd]
		if !ok {
			matchingChan = make(chan int)

			receiveChanLock.Lock()

			receiveChans[innerFd] = matchingChan

			receiveChanLock.Unlock()
		}

		matchingChan <- msg
	}(fd)
}

func waitAccept() int {
	res := <-acceptChan

	return res
}

func waitReceive(fd int) int {
	matchingChan, ok := receiveChans[fd]
	if !ok {
		matchingChan = make(chan int)

		receiveChanLock.Lock()

		receiveChans[fd] = matchingChan

		receiveChanLock.Unlock()
	}

	res := <-matchingChan

	return res
}

func main() {
	for {
		triggerAccept()

		go func() {
			fd := waitAccept()

			for {
				triggerReceive(fd)

				doneChan := make(chan struct{})

				go func(innerFd int) {
					msg := waitReceive(innerFd)

					fmt.Printf("Received from %v: %v\n", innerFd, msg)

					doneChan <- struct{}{}
				}(fd)

				<-doneChan
			}
		}()

		time.Sleep(time.Second * 2) // TODO: Replace this exit preventer (https://medium.com/swlh/getting-started-with-webassembly-and-go-by-building-an-image-to-ascii-converter-dea10bdf71f6)
	}
}
