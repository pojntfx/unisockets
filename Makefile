# All
all: build

# Build
build: \
    build-wasi-sdk \
    build-server-native-posix-c \
    build-server-berkeley-native-posix-go \
    build-server-berkeley-native-posix-tinygo \
    build-server-wasm-wasi-c \
    build-server-berkeley-wasm-jssi-go \
    build-server-berkeley-wasm-wasi-tinygo \
    build-server-berkeley-wasm-jssi-tinygo \
	build-client-native-posix-c \
    build-client-berkeley-native-posix-go \
    build-client-berkeley-native-posix-tinygo \
    build-client-wasm-wasi-c \
    build-client-berkeley-wasm-jssi-go \
    build-client-berkeley-wasm-wasi-tinygo \
    build-client-berkeley-wasm-jssi-tinygo

build-wasi-sdk:
	@docker build -t pojntfx/wasi-sdk examples/c

build-server-native-posix-c:
	@docker run -v ${PWD}/examples/c:/examples/c:z silkeh/clang sh -c 'cd /examples/c && mkdir -p out && clang echo_server.c -o out/echo_server'

build-server-berkeley-native-posix-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z golang sh -c 'cd /examples/go && go build -o out/go/berkeley_echo_server ./cmd/berkeley_echo_server/main.go'

build-server-berkeley-native-posix-tinygo:
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -o out/tinygo/echo_server ./cmd/berkeley_echo_server/main.go'

build-server-wasm-wasi-c: build-wasi-sdk
	@docker run -v ${PWD}/examples/c:/examples/c:z pojntfx/wasi-sdk sh -c 'cd /examples/c && mkdir -p out && clang -Wl,--allow-undefined -DIS_WASM -DBERKELEY_SOCKETS_WITH_ALIAS --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot echo_server.c -o out/echo_server_original.wasm && wasm-opt --asyncify -O out/echo_server_original.wasm -o out/echo_server.wasm'

build-server-berkeley-wasm-jssi-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /examples/go && go build -o out/go/berkeley_echo_server.wasm ./cmd/berkeley_echo_server/main.go'

build-server-berkeley-wasm-wasi-tinygo: build-wasi-sdk
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasi -o out/tinygo/berkeley_echo_server_wasi_original.wasm ./cmd/berkeley_echo_server/main.go'
	@docker run -v ${PWD}/examples/go:/examples/go:z pojntfx/wasi-sdk sh -c 'cd /examples/go && wasm-opt --asyncify -O out/tinygo/berkeley_echo_server_wasi_original.wasm -o out/tinygo/berkeley_echo_server_wasi.wasm'

build-server-berkeley-wasm-jssi-tinygo:
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasm -o out/tinygo/berkeley_echo_server.wasm ./cmd/berkeley_echo_server/main.go'

build-client-native-posix-c:
	@docker run -v ${PWD}/examples/c:/examples/c:z silkeh/clang sh -c 'cd /examples/c && mkdir -p out && clang echo_client.c -o out/echo_client'

build-client-berkeley-native-posix-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z golang sh -c 'cd /examples/go && go build -o out/go/berkeley_echo_client ./cmd/berkeley_echo_client/main.go'

build-client-berkeley-native-posix-tinygo:
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -o out/tinygo/berkeley_echo_client ./cmd/berkeley_echo_client/main.go'

build-client-wasm-wasi-c: build-wasi-sdk
	@docker run -v ${PWD}/examples/c:/examples/c:z pojntfx/wasi-sdk sh -c 'cd /examples/c && mkdir -p out && clang -Wl,--allow-undefined -DIS_WASM -DBERKELEY_SOCKETS_WITH_ALIAS --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot echo_client.c -o out/echo_client_original.wasm && wasm-opt --asyncify -O out/echo_client_original.wasm -o out/echo_client.wasm'

build-client-berkeley-wasm-jssi-go:
	@docker run -v ${PWD}/examples/go:/examples/go:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /examples/go && go build -o out/go/berkeley_echo_client.wasm ./cmd/berkeley_echo_client/main.go'

build-client-berkeley-wasm-wasi-tinygo: build-wasi-sdk
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasi -o out/tinygo/berkeley_echo_client_wasi_original.wasm ./cmd/berkeley_echo_client/main.go'
	@docker run -v ${PWD}/examples/go:/examples/go:z pojntfx/wasi-sdk sh -c 'cd /examples/go && wasm-opt --asyncify -O out/tinygo/berkeley_echo_client_wasi_original.wasm -o out/tinygo/berkeley_echo_client_wasi.wasm'

build-client-berkeley-wasm-jssi-tinygo:
	@docker run -v ${PWD}/examples/go:/examples/go:z tinygo/tinygo sh -c 'cd /examples/go && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasm -o out/tinygo/berkeley_echo_client.wasm ./cmd/berkeley_echo_client/main.go'

# Clean
clean: \
    clean-server-native-posix-c \
    clean-server-berkeley-native-posix-go \
    clean-server-berkeley-native-posix-tinygo \
    clean-server-wasm-wasi-c \
    clean-server-berkeley-wasm-jssi-go \
    clean-server-berkeley-wasm-wasi-tinygo \
    clean-server-berkeley-wasm-jssi-tinygo \
	clean-client-native-posix-c \
    clean-client-berkeley-native-posix-go \
    clean-client-berkeley-native-posix-tinygo \
    clean-client-wasm-wasi-c \
    clean-client-berkeley-wasm-jssi-go \
    clean-client-berkeley-wasm-wasi-tinygo \
    clean-client-berkeley-wasm-jssi-tinygo

clean-server-native-posix-c:
	@rm -f examples/c/out/echo_server

clean-server-berkeley-native-posix-go:
	@rm -f examples/go/out/go/berkeley_echo_server

clean-server-berkeley-native-posix-tinygo:
	@rm -f examples/go/out/tinygo/berkeley_echo_server

clean-server-wasm-wasi-c:
	@rm -f examples/c/out/echo_server_original.wasm
	@rm -f examples/c/out/echo_server.wasm

clean-server-berkeley-wasm-jssi-go:
	@rm -f examples/go/out/go/berkeley_echo_server.wasm

clean-server-berkeley-wasm-wasi-tinygo:
	@rm -f examples/go/out/tinygo/berkeley_echo_server_wasi_original.wasm
	@rm -f examples/go/out/tinygo/berkeley_echo_server_wasi.wasm

clean-server-berkeley-wasm-jssi-tinygo:
	@rm -f examples/go/out/tinygo/berkeley_echo_server.wasm

clean-client-native-posix-c:
	@rm -f examples/c/out/echo_client

clean-client-berkeley-native-posix-go:
	@rm -f examples/go/out/go/berkeley_echo_client

clean-client-berkeley-native-posix-tinygo:
	@rm -f examples/go/out/tinygo/berkeley_echo_client

clean-client-wasm-wasi-c:
	@rm -f examples/c/out/echo_client_original.wasm
	@rm -f examples/c/out/echo_client.wasm

clean-client-berkeley-wasm-jssi-go:
	@rm -f examples/go/out/go/berkeley_echo_client.wasm

clean-client-berkeley-wasm-wasi-tinygo:
	@rm -f examples/go/out/tinygo/berkeley_echo_client_wasi_original.wasm
	@rm -f examples/go/out/tinygo/berkeley_echo_client_wasi.wasm

clean-client-berkeley-wasm-jssi-tinygo:
	@rm -f examples/go/out/tinygo/berkeley_echo_client.wasm

# Run
run: \
    run-server-native-posix-c \
    run-server-berkeley-native-posix-go \
    run-server-berkeley-native-posix-tinygo \
	run-client-native-posix-c \
    run-client-berkeley-native-posix-go \
    run-client-berkeley-native-posix-tinygo

run-server-native-posix-c:
	@./examples/c/out/echo_server

run-server-berkeley-native-posix-go:
	@./examples/go/out/go/berkeley_echo_server

run-server-berkeley-native-posix-tinygo:
	@./examples/go/out/tinygo/berkeley_echo_server

run-client-native-posix-c:
	@./examples/c/out/echo_client

run-client-berkeley-native-posix-go:
	@./examples/go/out/go/berkeley_echo_client

run-client-berkeley-native-posix-tinygo:
	@./examples/go/out/tinygo/berkeley_echo_client