package main

import (
	"fmt"
	"math/big"
	"math"
)

func main() {

	sum := big.NewFloat(0)
	result := big.NewFloat(0)

	k := 2

	for i := 0; i <= k; i++ {
		sum = sum.Add(sum, sumElement(big.NewFloat(float64(i))))
	}
	fmt.Println(sum)

	result = Div(big.NewFloat(4270934400), Mul(big.NewFloat(math.Sqrt(10005)), sum))
	fmt.Println(result)
}

func sumElement(i *big.Float) *big.Float {
	return Pow(i,2);
}

func Pow(a *big.Float, e uint64) *big.Float {
    result := Zero().Copy(a)
    for i:=uint64(0); i<e-1; i++ {
        result = Mul(result, a)
    }
    return result
}

func Root(a *big.Float, n uint64) *big.Float {
    limit := Pow(New(2), 256)
    n1 := n-1
    n1f, rn := New(float64(n1)), Div(New(1.0), New(float64(n)))
    x, x0 := New(1.0), Zero()
    _ = x0
    for {
        potx, t2 := Div(New(1.0), x), a
        for b:=n1; b>0; b>>=1 {
            if b&1 == 1 {
                t2 = Mul(t2, potx)
            }
            potx = Mul(potx, potx)
        }
        x0, x = x, Mul(rn, Add(Mul(n1f, x), t2) )
        if Lesser(Mul(Abs(Sub(x, x0)), limit), x) { break }
    }
    return x
}

func Abs(a *big.Float) *big.Float {
    return Zero().Abs(a)
}

func New(f float64) *big.Float {
    r := big.NewFloat(f)
    r.SetPrec(256)
    return r
}

func Div(a, b *big.Float) *big.Float {
    return Zero().Quo(a, b)
}

func Zero() *big.Float {
    r := big.NewFloat(0.0)
    r.SetPrec(256)
    return r
}

func Mul(a, b *big.Float) *big.Float {
    return Zero().Mul(a, b)
}

func Add(a, b *big.Float) *big.Float {
    return Zero().Add(a, b)
}

func Sub(a, b *big.Float) *big.Float {
    return Zero().Sub(a, b)
}

func Lesser(x, y *big.Float) bool {
    return x.Cmp(y) == -1
}
