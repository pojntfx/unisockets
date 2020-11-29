package tinynet

import (
	"errors"
	"strconv"
	"strings"
)

type IP []byte

// type Addr interface{}

type TCPAddr struct {
	IP   IP
	Port int
	Zone string
}

func ResolveTCPAddr(network, address string) (*TCPAddr, error) {
	parts := strings.Split(address, ":")

	ip := make([]byte, 4) // xxx.xxx.xxx.xxx
	for i, part := range strings.Split(parts[0], ".") {
		innerPart, err := strconv.Atoi(part)
		if err != nil {
			return nil, errors.New("could not parse IP")
		}

		ip[i] = byte(innerPart)
	}

	port, err := strconv.Atoi(parts[1])
	if err != nil {
		return nil, errors.New("could not parse port")
	}

	return &TCPAddr{
		IP:   ip,
		Port: port,
		Zone: "",
	}, nil
}

// type Listener interface{}

type TCPListener struct{}

// func Listen(network, address string) (Listener, error) {
// 	return Listener{}, nil
// }

func ListenTCP(network string, laddr *TCPAddr) (*TCPListener, error) {
	return &TCPListener{}, nil
}

// type Conn struct{}

type TCPConn struct{}

// func (l *TCPListener) Accept() (Conn, error) {
// 	return Conn{}, nil
// }

func (l *TCPListener) AcceptTCP() (*TCPConn, error) {
	return &TCPConn{}, nil
}

// func Dial(network, address string) (Conn, error) {
// 	return Conn{}, nil
// }

func DialTCP(network string, laddr, raddr *TCPAddr) (*TCPConn, error) {
	return &TCPConn{}, nil
}

// func (c *Conn) Read(b []byte) (int, error) {
// 	return 0, nil
// }

func (c *TCPConn) Read(b []byte) (int, error) {
	return 0, nil
}

// func (c *Conn) Write(b []byte) (int, error) {
// 	return 0, nil
// }

func (c *TCPConn) Write(b []byte) (int, error) {
	return 0, nil
}

// func (c *Conn) Close() error {
// 	return nil
// }

func (c *TCPConn) Close() error {
	return nil
}
