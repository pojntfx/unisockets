package unisockets

type SockaddrIn struct {
	SinFamily uint16
	SinPort   uint16
	SinAddr   struct {
		SAddr uint32
	}
}
