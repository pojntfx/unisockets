package main

/*
#include <berkeley_sockets.h>
*/
import "C"
import "fmt"

func main() {
	fmt.Println(C.socket(C.PF_INET, C.SOCK_STREAM, 0))
}
