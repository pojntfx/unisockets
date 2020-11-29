package tinynet

import (
	"encoding/binary"
	"errors"
	"strconv"
	"strings"
	"unsafe"

	"github.com/pojntfx/webassembly-berkeley-sockets-via-webrtc/examples/go/pkg/sockets"
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

type TCPListener struct {
	fd int32
}

// func Listen(network, address string) (Listener, error) {
// 	return Listener{}, nil
// }

func ListenTCP(network string, laddr *TCPAddr) (*TCPListener, error) {
	// Create address
	serverAddress := sockets.SockaddrIn{
		SinFamily: sockets.PF_INET,
		SinPort:   sockets.Htons(uint16(laddr.Port)),
		SinAddr: struct{ SAddr uint32 }{
			SAddr: binary.LittleEndian.Uint32(laddr.IP),
		},
	}

	// Create socket
	serverSocket, err := sockets.Socket(sockets.PF_INET, sockets.SOCK_STREAM, 0)
	if err != nil {
		return nil, err
	}

	// Bind
	if err := sockets.Bind(serverSocket, &serverAddress); err != nil {
		return nil, err
	}

	// Listen
	if err := sockets.Listen(serverSocket, 5); err != nil {
		return nil, err
	}

	return &TCPListener{
		fd: serverSocket,
	}, nil
}

// type Conn struct{}

type TCPConn struct {
	fd int32
}

// func (l *TCPListener) Accept() (Conn, error) {
// 	return Conn{}, nil
// }

func (l *TCPListener) AcceptTCP() (*TCPConn, error) {
	clientAddress := sockets.SockaddrIn{}

	// Accept
	clientSocket, err := sockets.Accept(l.fd, &clientAddress)
	if err != nil {
		return nil, err
	}

	return &TCPConn{
		fd: clientSocket,
	}, nil
}

// func Dial(network, address string) (Conn, error) {
// 	return Conn{}, nil
// }

func DialTCP(network string, laddr, raddr *TCPAddr) (*TCPConn, error) {
	// Create address
	serverAddress := sockets.SockaddrIn{
		SinFamily: sockets.PF_INET,
		SinPort:   sockets.Htons(uint16(raddr.Port)),
		SinAddr: struct{ SAddr uint32 }{
			SAddr: binary.LittleEndian.Uint32(raddr.IP),
		},
	}

	// Create socket
	serverSocket, err := sockets.Socket(sockets.PF_INET, sockets.SOCK_STREAM, 0)
	if err != nil {
		return nil, err
	}

	// Connect
	if err := sockets.Connect(serverSocket, &serverAddress); err != nil {
		return nil, err
	}

	return &TCPConn{
		fd: serverSocket,
	}, nil
}

// func (c *Conn) Read(b []byte) (int, error) {
// 	return 0, nil
// }

func (c *TCPConn) Read(b []byte) (int, error) {
	n, err := sockets.Recv(c.fd, &b, uint32(unsafe.Sizeof(b)), 0) // TODO: Get pointer passing to work

	return int(n), err
}

// func (c *Conn) Write(b []byte) (int, error) {
// 	return 0, nil
// }

func (c *TCPConn) Write(b []byte) (int, error) {
	n, err := sockets.Send(c.fd, b, 0)

	return int(n), err
}

// func (c *Conn) Close() error {
// 	return nil
// }

func (c *TCPConn) Close() error {
	return sockets.Shutdown(c.fd, sockets.SHUT_RDWR)
}
