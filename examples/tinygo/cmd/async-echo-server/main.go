package main

import (
	"fmt"
	"time"
)

var (
	acceptChan = make(chan int)
)

func triggerAccept()

//export resolveAccept
func resolveAccept(fd int) {
	go func(innerFd int) {
		fmt.Println("Resolved")

		acceptChan <- innerFd
	}(fd)
}

func waitAccept() int {
	res := <-acceptChan

	return res
}

func main() {
	for {
		fmt.Println("Accepting")

		triggerAccept()

		fmt.Println("Triggered")

		go func() {
			fmt.Println("Waiting")

			fd := waitAccept()

			for {
				fmt.Println("Waited", fd)

				time.Sleep(time.Millisecond * 500)
			}
		}()

		time.Sleep(time.Second * 2)
	}
}
