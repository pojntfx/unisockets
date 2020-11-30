# All
all: build

# Build
build: \
    build-wasi-sdk \
    build-server-native-posix-c \
    build-server-berkeley-native-posix-go \
    build-server-net-native-posix-go \
    build-server-tcp-native-posix-go \
    build-server-berkeley-native-posix-tinygo \
    build-server-net-native-posix-tinygo \
    build-server-tcp-native-posix-tinygo \
    build-server-wasm-wasi-c \
    build-server-berkeley-wasm-jssi-go \
    build-server-net-wasm-jssi-go \
    build-server-tcp-wasm-jssi-go \
    build-server-berkeley-wasm-wasi-tinygo \
    build-server-berkeley-wasm-jssi-tinygo \
	build-server-net-wasm-wasi-tinygo \
	build-server-tcp-wasm-wasi-tinygo \
	build-client-native-posix-c \
    build-client-berkeley-native-posix-go \
    build-client-net-native-posix-go \
    build-client-tcp-native-posix-go \
    build-client-berkeley-native-posix-tinygo \
    build-client-net-native-posix-tinygo \
    build-client-tcp-native-posix-tinygo \
    build-client-wasm-wasi-c \
    build-client-berkeley-wasm-jssi-go \
    build-client-net-wasm-jssi-go \
    build-client-tcp-wasm-jssi-go \
    build-client-berkeley-wasm-wasi-tinygo \
    build-client-berkeley-wasm-jssi-tinygo \
	build-client-net-wasm-wasi-tinygo \
	build-client-tcp-wasm-wasi-tinygo

build-wasi-sdk:
	@docker build -t pojntfx/wasi-sdk examples/c

build-server-native-posix-c:
	@docker run -v ${PWD}/examples/c:/examples/c:z silkeh/clang sh -c 'cd /examples/c && mkdir -p out && clang echo_server.c -o out/berkeley_echo_server'

build-server-berkeley-native-posix-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z golang sh -c 'cd /examples/go && go build -o out/go/berkeley_echo_server ./cmd/berkeley_echo_server/main.go'

build-server-net-native-posix-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z golang sh -c 'cd /examples/go && go build -o out/go/net_echo_server ./cmd/net_echo_server/main.go'

build-server-tcp-native-posix-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z golang sh -c 'cd /examples/go && go build -o out/go/tcp_echo_server ./cmd/tcp_echo_server/main.go'

build-server-berkeley-native-posix-tinygo:
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -o out/tinygo/berkeley_echo_server ./cmd/berkeley_echo_server/main.go'

build-server-net-native-posix-tinygo:
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -o out/tinygo/net_echo_server ./cmd/net_echo_server/main.go'

build-server-tcp-native-posix-tinygo:
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -o out/tinygo/tcp_echo_server ./cmd/tcp_echo_server/main.go'

build-server-wasm-wasi-c: build-wasi-sdk
	@docker run -v ${PWD}/examples/c:/examples/c:z pojntfx/wasi-sdk sh -c 'cd /examples/c && mkdir -p out && clang -Wl,--allow-undefined -DIS_WASM -DBERKELEY_SOCKETS_WITH_ALIAS --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot echo_server.c -o out/berkeley_echo_server_original.wasm && wasm-opt --asyncify -O out/berkeley_echo_server_original.wasm -o out/berkeley_echo_server.wasm'

build-server-berkeley-wasm-jssi-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /examples/go && go build -o out/go/berkeley_echo_server.wasm ./cmd/berkeley_echo_server/main.go'

build-server-net-wasm-jssi-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /examples/go && go build -o out/go/net_echo_server.wasm ./cmd/net_echo_server/main.go'

build-server-tcp-wasm-jssi-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /examples/go && go build -o out/go/tcp_echo_server.wasm ./cmd/tcp_echo_server/main.go'

build-server-berkeley-wasm-wasi-tinygo: build-wasi-sdk
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasi -o out/tinygo/berkeley_echo_server_wasi_original.wasm ./cmd/berkeley_echo_server/main.go'
	@docker run -v ${PWD}/examples/go:/examples/go:z pojntfx/wasi-sdk sh -c 'cd /examples/go && wasm-opt --asyncify -O out/tinygo/berkeley_echo_server_wasi_original.wasm -o out/tinygo/berkeley_echo_server_wasi.wasm'

build-server-berkeley-wasm-jssi-tinygo:
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasm -o out/tinygo/berkeley_echo_server.wasm ./cmd/berkeley_echo_server/main.go'

build-server-net-wasm-wasi-tinygo: build-wasi-sdk
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasi -o out/tinygo/net_echo_server_wasi_original.wasm ./cmd/net_echo_server/main.go'
	@docker run -v ${PWD}/examples/go:/examples/go:z pojntfx/wasi-sdk sh -c 'cd /examples/go && wasm-opt --asyncify -O out/tinygo/net_echo_server_wasi_original.wasm -o out/tinygo/net_echo_server_wasi.wasm'

build-server-tcp-wasm-wasi-tinygo: build-wasi-sdk
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasi -o out/tinygo/tcp_echo_server_wasi_original.wasm ./cmd/tcp_echo_server/main.go'
	@docker run -v ${PWD}/examples/go:/examples/go:z pojntfx/wasi-sdk sh -c 'cd /examples/go && wasm-opt --asyncify -O out/tinygo/tcp_echo_server_wasi_original.wasm -o out/tinygo/tcp_echo_server_wasi.wasm'

build-client-native-posix-c:
	@docker run -v ${PWD}/examples/c:/examples/c:z silkeh/clang sh -c 'cd /examples/c && mkdir -p out && clang echo_client.c -o out/berkeley_echo_client'

build-client-berkeley-native-posix-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z golang sh -c 'cd /examples/go && go build -o out/go/berkeley_echo_client ./cmd/berkeley_echo_client/main.go'

build-client-net-native-posix-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z golang sh -c 'cd /examples/go && go build -o out/go/net_echo_client ./cmd/net_echo_client/main.go'

build-client-tcp-native-posix-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z golang sh -c 'cd /examples/go && go build -o out/go/tcp_echo_client ./cmd/tcp_echo_client/main.go'

build-client-berkeley-native-posix-tinygo:
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -o out/tinygo/berkeley_echo_client ./cmd/berkeley_echo_client/main.go'

build-client-net-native-posix-tinygo:
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -o out/tinygo/net_echo_client ./cmd/net_echo_client/main.go'

build-client-tcp-native-posix-tinygo:
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -o out/tinygo/tcp_echo_client ./cmd/tcp_echo_client/main.go'

build-client-wasm-wasi-c: build-wasi-sdk
	@docker run -v ${PWD}/examples/c:/examples/c:z pojntfx/wasi-sdk sh -c 'cd /examples/c && mkdir -p out && clang -Wl,--allow-undefined -DIS_WASM -DBERKELEY_SOCKETS_WITH_ALIAS --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot echo_client.c -o out/berkeley_echo_client_original.wasm && wasm-opt --asyncify -O out/berkeley_echo_client_original.wasm -o out/berkeley_echo_client.wasm'

build-client-berkeley-wasm-jssi-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /examples/go && go build -o out/go/berkeley_echo_client.wasm ./cmd/berkeley_echo_client/main.go'

build-client-net-wasm-jssi-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /examples/go && go build -o out/go/net_echo_client.wasm ./cmd/net_echo_client/main.go'

build-client-tcp-wasm-jssi-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /examples/go && go build -o out/go/tcp_echo_client.wasm ./cmd/tcp_echo_client/main.go'

build-client-berkeley-wasm-wasi-tinygo: build-wasi-sdk
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasi -o out/tinygo/berkeley_echo_client_wasi_original.wasm ./cmd/berkeley_echo_client/main.go'
	@docker run -v ${PWD}/examples/go:/examples/go:z pojntfx/wasi-sdk sh -c 'cd /examples/go && wasm-opt --asyncify -O out/tinygo/berkeley_echo_client_wasi_original.wasm -o out/tinygo/berkeley_echo_client_wasi.wasm'

build-client-berkeley-wasm-jssi-tinygo:
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasm -o out/tinygo/berkeley_echo_client.wasm ./cmd/berkeley_echo_client/main.go'

build-client-net-wasm-wasi-tinygo: build-wasi-sdk
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasi -o out/tinygo/net_echo_client_wasi_original.wasm ./cmd/net_echo_client/main.go'
	@docker run -v ${PWD}/examples/go:/examples/go:z pojntfx/wasi-sdk sh -c 'cd /examples/go && wasm-opt --asyncify -O out/tinygo/net_echo_client_wasi_original.wasm -o out/tinygo/net_echo_client_wasi.wasm'

build-client-tcp-wasm-wasi-tinygo: build-wasi-sdk
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasi -o out/tinygo/tcp_echo_client_wasi_original.wasm ./cmd/tcp_echo_client/main.go'
	@docker run -v ${PWD}/examples/go:/examples/go:z pojntfx/wasi-sdk sh -c 'cd /examples/go && wasm-opt --asyncify -O out/tinygo/tcp_echo_client_wasi_original.wasm -o out/tinygo/tcp_echo_client_wasi.wasm'

# Clean
clean: \
    clean-server-native-posix-c \
    clean-server-berkeley-native-posix-go \
    clean-server-net-native-posix-go \
    clean-server-tcp-native-posix-go \
    clean-server-berkeley-native-posix-tinygo \
    clean-server-net-native-posix-tinygo \
    clean-server-tcp-native-posix-tinygo \
    clean-server-wasm-wasi-c \
    clean-server-berkeley-wasm-jssi-go \
    clean-server-net-wasm-jssi-go \
    clean-server-tcp-wasm-jssi-go \
    clean-server-berkeley-wasm-wasi-tinygo \
    clean-server-berkeley-wasm-jssi-tinygo \
    clean-server-net-wasm-wasi-tinygo \
    clean-server-tcp-wasm-wasi-tinygo \
	clean-client-native-posix-c \
    clean-client-berkeley-native-posix-go \
    clean-client-net-native-posix-go \
    clean-client-tcp-native-posix-go \
    clean-client-berkeley-native-posix-tinygo \
    clean-client-net-native-posix-tinygo \
    clean-client-tcp-native-posix-tinygo \
    clean-client-wasm-wasi-c \
    clean-client-berkeley-wasm-jssi-go \
    clean-client-net-wasm-jssi-go \
    clean-client-tcp-wasm-jssi-go \
    clean-client-berkeley-wasm-wasi-tinygo \
    clean-client-berkeley-wasm-jssi-tinygo \
    clean-client-net-wasm-wasi-tinygo \
    clean-client-tcp-wasm-wasi-tinygo

clean-server-native-posix-c:
	@rm -f examples/c/out/berkeley_echo_server

clean-server-berkeley-native-posix-go:
	@rm -f examples/go/out/go/berkeley_echo_server

clean-server-net-native-posix-go:
	@rm -f examples/go/out/go/net_echo_server

clean-server-tcp-native-posix-go:
	@rm -f examples/go/out/go/tcp_echo_server

clean-server-berkeley-native-posix-tinygo:
	@rm -f examples/go/out/tinygo/berkeley_echo_server

clean-server-net-native-posix-tinygo:
	@rm -f examples/go/out/tinygo/net_echo_server

clean-server-tcp-native-posix-tinygo:
	@rm -f examples/go/out/tinygo/tcp_echo_server

clean-server-wasm-wasi-c:
	@rm -f examples/c/out/berkeley_echo_server_original.wasm
	@rm -f examples/c/out/berkeley_echo_server.wasm

clean-server-berkeley-wasm-jssi-go:
	@rm -f examples/go/out/go/berkeley_echo_server.wasm

clean-server-net-wasm-jssi-go:
	@rm -f examples/go/out/go/net_echo_server.wasm

clean-server-tcp-wasm-jssi-go:
	@rm -f examples/go/out/go/tcp_echo_server.wasm

clean-server-berkeley-wasm-wasi-tinygo:
	@rm -f examples/go/out/tinygo/berkeley_echo_server_wasi_original.wasm
	@rm -f examples/go/out/tinygo/berkeley_echo_server_wasi.wasm

clean-server-berkeley-wasm-jssi-tinygo:
	@rm -f examples/go/out/tinygo/berkeley_echo_server.wasm

clean-server-net-wasm-wasi-tinygo:
	@rm -f examples/go/out/tinygo/net_echo_server.wasm

clean-server-tcp-wasm-wasi-tinygo:
	@rm -f examples/go/out/tinygo/tcp_echo_server.wasm

clean-client-native-posix-c:
	@rm -f examples/c/out/berkeley_echo_client

clean-client-berkeley-native-posix-go:
	@rm -f examples/go/out/go/berkeley_echo_client

clean-client-net-native-posix-go:
	@rm -f examples/go/out/go/net_echo_client

clean-client-tcp-native-posix-go:
	@rm -f examples/go/out/go/tcp_echo_client

clean-client-berkeley-native-posix-tinygo:
	@rm -f examples/go/out/tinygo/berkeley_echo_client

clean-client-net-native-posix-tinygo:
	@rm -f examples/go/out/tinygo/net_echo_client

clean-client-tcp-native-posix-tinygo:
	@rm -f examples/go/out/tinygo/tcp_echo_client

clean-client-wasm-wasi-c:
	@rm -f examples/c/out/berkeley_echo_client_original.wasm
	@rm -f examples/c/out/berkeley_echo_client.wasm

clean-client-berkeley-wasm-jssi-go:
	@rm -f examples/go/out/go/berkeley_echo_client.wasm

clean-client-net-wasm-jssi-go:
	@rm -f examples/go/out/go/net_echo_client.wasm

clean-client-tcp-wasm-jssi-go:
	@rm -f examples/go/out/go/tcp_echo_client.wasm

clean-client-berkeley-wasm-wasi-tinygo:
	@rm -f examples/go/out/tinygo/berkeley_echo_client_wasi_original.wasm
	@rm -f examples/go/out/tinygo/berkeley_echo_client_wasi.wasm

clean-client-berkeley-wasm-jssi-tinygo:
	@rm -f examples/go/out/tinygo/berkeley_echo_client.wasm

clean-client-net-wasm-wasi-tinygo:
	@rm -f examples/go/out/tinygo/net_echo_client.wasm

clean-client-tcp-wasm-wasi-tinygo:
	@rm -f examples/go/out/tinygo/tcp_echo_client.wasm

# Run
run: \
    run-server-native-posix-c \
    run-server-berkeley-native-posix-go \
    run-server-net-posix-go \
    run-server-tcp-posix-go \
    run-server-berkeley-native-posix-tinygo \
    run-server-net-native-posix-tinygo \
    run-server-tcp-native-posix-tinygo \
	run-client-native-posix-c \
    run-client-berkeley-native-posix-go \
    run-client-net-native-posix-go \
    run-client-tcp-native-posix-go \
    run-client-berkeley-native-posix-tinygo \
    run-client-net-native-posix-tinygo \
    run-client-tcp-native-posix-tinygo

run-server-native-posix-c:
	@./examples/c/out/berkeley_echo_server

run-server-berkeley-native-posix-go:
	@./examples/go/out/go/berkeley_echo_server

run-server-net-native-posix-go:
	@./examples/go/out/go/net_echo_server

run-server-tcp-native-posix-go:
	@./examples/go/out/go/tcp_echo_server

run-server-berkeley-native-posix-tinygo:
	@./examples/go/out/tinygo/berkeley_echo_server

run-server-net-native-posix-tinygo:
	@./examples/go/out/tinygo/net_echo_server

run-server-tcp-native-posix-tinygo:
	@./examples/go/out/tinygo/tcp_echo_server

run-client-native-posix-c:
	@./examples/c/out/berkeley_echo_client

run-client-berkeley-native-posix-go:
	@./examples/go/out/go/berkeley_echo_client

run-client-net-native-posix-go:
	@./examples/go/out/go/net_echo_client

run-client-tcp-native-posix-go:
	@./examples/go/out/go/tcp_echo_client

run-client-berkeley-native-posix-tinygo:
	@./examples/go/out/tinygo/berkeley_echo_client

run-client-net-native-posix-tinygo:
	@./examples/go/out/tinygo/net_echo_client

run-client-tcp-native-posix-tinygo:
	@./examples/go/out/tinygo/tcp_echo_client