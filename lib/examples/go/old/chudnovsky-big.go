package main

import (
	"fmt"
	"math/big"
	"reflect"
)

func main() {

	sum := big.NewFloat(0)

	k := 2

	// bigFloat
	fmt.Println(reflect.TypeOf(sum))
	// int
	fmt.Println(reflect.TypeOf(k))
	for i := 0; i <= k; i++ {
		sum = sum.Add(sum, sumElement(big.NewFloat(float64(i))))
	}
	// 0
	fmt.Println(sum)
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

func Zero() *big.Float {
    r := big.NewFloat(0.0)
    r.SetPrec(256)
    return r
}

func Mul(a, b *big.Float) *big.Float {
    return Zero().Mul(a, b)
}
