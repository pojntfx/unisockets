# unisockets

A universal Berkeley sockets implementation for both WebAssembly (based on WebRTC) and native platforms with bindings for C, Go and TinyGo.

![Yarn CI](https://github.com/pojntfx/unisockets/workflows/Yarn%20CI/badge.svg)
![make CI](https://github.com/pojntfx/unisockets/workflows/make%20CI/badge.svg)
![Mirror](https://github.com/pojntfx/unisockets/workflows/Mirror/badge.svg)
[![TypeDoc](https://img.shields.io/badge/TypeScript-Documentation-informational)](https://pojntfx.github.io/unisockets/)
[![PkgGoDev](https://pkg.go.dev/badge/github.com/pojntfx/unisockets)](https://pkg.go.dev/github.com/pojntfx/unisockets)

## Overview

unisockets implements the [Berkeley sockets API](https://en.wikipedia.org/wiki/Berkeley_sockets). On a native environment like Linux, it falls back to the native Berkeley sockets API; on WASM it uses [WebRTC](https://webrtc.org/) for fast peer-to-peer communication instead of the (non-available) native API. This allows you to "just recompile" an existing socket server/client (such as a web server etc.) and run it natively, in a WebAssembly runtime or in the browser, without the need for a [WebSocket proxy like in emscripen](https://emscripten.org/docs/porting/networking.html) or some other proxy mechanism. You've heard that right, this library allows you to `bind` in the browser!

### Components

![UML Diagram](https://pojntfx.github.io/unisockets/media/diagram.svg)

The system is made up of the following components:

- **Signaling**: A WebRTC signaling server, client and protocol has been implemented to allow for nodes to discover each other and exchange candidates, but is not involved in any actual connections. When compiling natively, it is not required.
- **Transport**: A minimal wrapper around the WebRTC API. When compiling to WASM, this component manages all actual data transfers and handles incoming/outgoing peer to peer connections. When compiling natively, it is not required.
- **Sockets**: A set of WebAssembly imports that satisfy the basic API of the Berkeley sockets, such as `socket`, `bind`, `listen, `accept`, `connect`, `send`, `recv` etc. When compiling natively, it falls back to the native implementation.

These components have no hard dependencies on one another, and can be used independenly.

Additionally, a [universal C/C++ header](https://github.com/pojntfx/unisockets/blob/main/cmd/c_echo_client/berkeley_sockets.h) for easy usage and Go/TinyGo bindings (See [![PkgGoDev](https://pkg.go.dev/badge/github.com/pojntfx/unisockets/pkg/unisockets)](https://pkg.go.dev/github.com/pojntfx/unisockets/pkg/unisockets)) have been created.

### Further Resources

Interested in an implementation of the [Go `net` package](https://golang.org/pkg/net/) based on this package, with TinyGo and WASM support? You might be interested in [tinynet](https://github.com/pojntfx/tinynet)!

## Usage

Check out [![PkgGoDev](https://pkg.go.dev/badge/github.com/pojntfx/unisockets)](https://pkg.go.dev/github.com/pojntfx/unisockets) for API documentation. Many examples on how to use it (C, TinyGo & Go clients & servers plus an example WebAssembly runner) can also be found in [the `cmd` folder](https://github.com/pojntfx/unisockets/blob/main/cmd). Looking for advice on how to build and run natively and using WASM? Check out the [`Makefile`](https://github.com/pojntfx/unisockets/blob/main/Makefile)!

## License

unisockets (c) 2020 Felicitas Pojtinger

SPDX-License-Identifier: AGPL-3.0
