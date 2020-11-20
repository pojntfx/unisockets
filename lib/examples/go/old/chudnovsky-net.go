package main

import (
	"flag"
	"fmt"
	"math/big"
	"strconv"
	//"github.com/remyoudompheng/bigfft"
)

var (
	one = bigInt(1)
	two = bigInt(2)

	a          = bigInt(13591409)
	b          = bigInt(545140134)
	c          = bigInt(640320)
	cTo3Over24 = quo(expt(c, bigInt(3)), bigInt(24))
	d          = bigInt(12)
)

//  -1^n*g
func m1ToNmulG(n, g *big.Int) *big.Int {
	if odd(n) {
		return newInt().Neg(g)
	}
	return g
}

func split(m, n *big.Int) (g, p, q *big.Int) {
	if eqv(sub(n, m), one) {
		sixN := mul(bigInt(6), n)
		g := mul(mul(sub(sixN, bigInt(5)), sub(add(n, n), one)),
			sub(sixN, one))
		return g,
			mul(cTo3Over24, expt(n, bigInt(3))),
			mul(m1ToNmulG(n, g), add(mul(n, b), a))
	}
	mid := quo(add(m, n), two)
	g1, p1, q1 := split(m, mid)
	g2, p2, q2 := split(mid, n)
	return mul(g1, g2), mul(p1, p2), add(mul(q1, p2), mul(q2, g1))
}

func Π(digits int) *big.Int {
	terms := bigInt(2 + int(float64(digits)/14.181647462))
	sqrtC := isqrt(mul(c, expt(bigInt(100), bigInt(digits))))
	_, p, q := split(bigInt(0), terms)
	return quo(mul(p, mul(c, sqrtC)), mul(d, add(q, mul(p, a))))
}

func isqrt(n *big.Int) *big.Int {
	a, b := divMod(bigInt(n.BitLen()), two)
	x := expt(two, add(a, b))
	for {
		y := quo(add(x, quo(n, x)), two)
		if y.Cmp(x) >= 0 {
			return x
		}
		x = y
	}
}

func expt(x, y *big.Int) *big.Int { return newInt().Exp(x, y, nil) }
func quo(x, y *big.Int) *big.Int  { return newInt().Quo(x, y) }
func rem(x, y *big.Int) *big.Int  { return newInt().Rem(x, y) }
func sub(x, y *big.Int) *big.Int  { return newInt().Sub(x, y) }
func add(x, y *big.Int) *big.Int  { return newInt().Add(x, y) }

//func mul(x, y *big.Int)*big.Int { return bigfft.Mul(x, y) }
func mul(x, y *big.Int) *big.Int { return newInt().Mul(x, y) }
func eqv(x, y *big.Int) bool     { return x.Cmp(y) == 0 }
func divMod(n, m *big.Int) (a, b *big.Int) {
	return newInt().DivMod(n, m, newInt())
}

func bigInt(n int) *big.Int { return big.NewInt(int64(n)) }
func newInt() *big.Int      { return new(big.Int) }
func odd(n *big.Int) bool   { return eqv(rem(n, two), one) }

var flagv = flag.Bool("v", true, "verbose")

func main() {
	flag.Parse()
	dig := 100000
	if flag.NArg() > 0 {
		dig, _ = strconv.Atoi(flag.Arg(0))
	}
	pi := (Π(dig))

	if *flagv {
		fmt.Printf("%v\n", pi)
	}
}
