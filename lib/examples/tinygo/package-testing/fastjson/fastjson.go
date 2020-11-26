package main

import (
	"fmt"
	"log"

	"github.com/valyala/fastjson"
)

func main() {

	// start with string and return object
	// var p fastjson.Parser
	// v, err := p.Parse(`{
	// 	"str": "bar",
	// 	"int": 123,
	// 	"float": 1.23,
	// 	"bool": true,
	// 	"arr": [1, "foo", {}]
	// }`)
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// fmt.Println(v)

	// end with object and get bytes or string out -- brauchen wir vielleicht nicht. Ich glaube wir koennen auch einfach das Object v aus dem Tutorial writen
	newJSON := stringToJSON(`{
		"str": "bar",
		"int": 123,
		"float": 1.23,
		"bool": true,
		"arr": [1, "foo", {}]
}`)
	fmt.Println(newJSON.GetStringBytes("str"))
	fmt.Println(newJSON.GetInt("int"))

}

func stringToJSON(input string) *fastjson.Value {
	var p fastjson.Parser
	v, err := p.Parse(input)
	if err != nil {
		log.Fatal(err)
	}

	return v
}
