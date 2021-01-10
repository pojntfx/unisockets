# unisockets

A universal Berkeley sockets implementation for both WebAssembly (based on WebRTC) and native platforms with bindings for C, Go and TinyGo.

![Yarn CI](https://github.com/alphahorizonio/unisockets/workflows/Yarn%20CI/badge.svg)
![make CI](https://github.com/alphahorizonio/unisockets/workflows/make%20CI/badge.svg)
![Mirror](https://github.com/alphahorizonio/unisockets/workflows/Mirror/badge.svg)
[![TypeDoc](https://img.shields.io/badge/TypeScript-Documentation-informational)](https://alphahorizonio.github.io/unisockets/)
[![PkgGoDev](https://pkg.go.dev/badge/github.com/alphahorizonio/unisockets)](https://pkg.go.dev/github.com/alphahorizonio/unisockets)
[![npm](https://img.shields.io/npm/v/@alphahorizonio/unisockets)](https://www.npmjs.com/package/@alphahorizonio/unisockets)
[![Minimal Demo](https://img.shields.io/badge/Minimal%20Demo-unisockets.vercel.app-blueviolet)](https://unisockets.vercel.app/)
[![Lite (webnetes) Demo](<https://img.shields.io/badge/Lite%20(webnetes)%20Demo-lite.webnetes.dev-blueviolet>)](https://lite.webnetes.dev/)
[![Full (webnetes) Demo](<https://img.shields.io/badge/Full%20(webnetes)%20Demo-webnetes.dev-blueviolet>)](https://webnetes.dev/)
[![Part of webnetes](https://img.shields.io/badge/Part%20of-webnetes-black)](https://webnetes.dev/)

## Overview

unisockets implements the [Berkeley sockets API](https://en.wikipedia.org/wiki/Berkeley_sockets). On a native environment like Linux, it falls back to the native Berkeley sockets API; on WASM it uses [WebRTC](https://webrtc.org/) for fast peer-to-peer communication instead of the (non-available) native API. This allows you to "just recompile" an existing socket server/client (such as a web server etc.) and run it natively, in a WebAssembly runtime or in the browser, without the need for a [WebSocket proxy like in emscripen](https://emscripten.org/docs/porting/networking.html) or some other proxy mechanism. You've heard that right, this library allows you to `bind` in the browser!

### Components

[![UML Diagram](https://alphahorizonio.github.io/unisockets/media/diagram.svg)](https://alphahorizonio.github.io/unisockets/media/diagram.svg)

The system is made up of the following components:

- **Signaling**: A WebRTC signaling server (with two implementations), client and protocol has been implemented to allow for nodes to discover each other and exchange candidates, but is not involved in any actual connections. When compiling natively, it is not required.
- **Transport**: A minimal wrapper around the WebRTC API. When compiling to WASM, this component manages all actual data transfers and handles incoming/outgoing peer to peer connections. When compiling natively, it is not required.
- **Sockets**: A set of WebAssembly imports that satisfy the basic API of the Berkeley sockets, such as `socket`, `bind`, `listen`, `accept`, `connect`, `send`, `recv` etc. When compiling natively, it falls back to the native implementation.

These components have no hard dependencies on one another, and can be used independendly.

Additionally, a [universal C/C++ header](https://github.com/alphahorizonio/unisockets/blob/main/cmd/c_echo_client/unisockets.h) for easy usage and Go/TinyGo bindings (see [![PkgGoDev](https://pkg.go.dev/badge/github.com/alphahorizonio/unisockets/pkg/unisockets)](https://pkg.go.dev/github.com/alphahorizonio/unisockets/pkg/unisockets)) have been created.

### Signaling Protocol

The signaling components use the following protocol:

[![Sequence Diagram](https://alphahorizonio.github.io/unisockets/media/sequence.svg)](https://alphahorizonio.github.io/unisockets/media/sequence.svg)

There are two implementations of the signaling server. The TypeScript version is maintained is this repo, the Java version can be found in [junisockets](https://github.com/alphahorizonio/junisockets).

Public signaling server instances:

| Implementation | URL                            |
| -------------- | ------------------------------ |
| TypeScript     | `wss://signaler.webnetes.dev`  |
| Java           | `wss://jsignaler.webnetes.dev` |

### Further Resources

Interested in an implementation of the [Go `net` package](https://golang.org/pkg/net/) based on this package, with TinyGo and WASM support? You might be interested in [tinynet](https://github.com/alphahorizonio/tinynet)!

You want a Kubernetes-style system for WASM, running in the browser and in node? You might be interested in [webnetes](https://github.com/alphahorizonio/webnetes), which uses unisockets for it's networking layer.

## Usage

Check out the [universal C/C++ header](https://github.com/alphahorizonio/unisockets/blob/main/cmd/c_echo_client/unisockets.h) for the C API docs or [![PkgGoDev](https://pkg.go.dev/badge/github.com/alphahorizonio/unisockets)](https://pkg.go.dev/github.com/alphahorizonio/unisockets) for the Go/TinyGo API. Many examples on how to use it (C, TinyGo & Go clients & servers plus an example WebAssembly runner) can also be found in [the `cmd` folder](https://github.com/alphahorizonio/unisockets/blob/main/cmd). Looking for advice on how to build and run natively or using WASM? Check out the [`Makefile`](https://github.com/alphahorizonio/unisockets/blob/main/Makefile)!

## License

unisockets (c) 2021 Felicitas Pojtinger and contributors

SPDX-License-Identifier: AGPL-3.0
