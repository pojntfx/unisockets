# All
all: build

# Build
build: \
    build-unisockets-runner \
    build-server-native-posix-c \
    build-server-native-posix-go \
    build-server-native-posix-tinygo \
    build-server-wasm-wasi-c \
    build-server-wasm-jssi-go \
    build-server-wasm-wasi-tinygo \
    build-server-wasm-jssi-tinygo \
	build-client-native-posix-c \
    build-client-native-posix-go \
    build-client-native-posix-tinygo \
    build-client-wasm-wasi-c \
    build-client-wasm-jssi-go \
    build-client-wasm-wasi-tinygo \
    build-client-wasm-jssi-tinygo

build-unisockets-runner:
	@docker build -t alphahorizonio/unisockets-runner -f Dockerfile.unisockets-runner .

build-server-native-posix-c:
	@docker run -v ${PWD}:/src:z silkeh/clang sh -c 'cd /src && mkdir -p out/c && clang ./cmd/c_echo_server/main.c -o out/c/echo_server'
build-server-native-posix-go:
	@docker run -v ${PWD}:/src:z golang sh -c 'cd /src && go build -o out/go/echo_server ./cmd/go_echo_server/main.go'
build-server-native-posix-tinygo:
	@docker run -v ${PWD}:/src:z tinygo/tinygo sh -c 'cd /src && mkdir -p out/tinygo && tinygo build -o out/tinygo/echo_server ./cmd/go_echo_server/main.go'
build-server-wasm-wasi-c:
	@docker run -v ${PWD}:/src:z alphahorizonio/wasi-sdk sh -c 'cd /src && mkdir -p out/c && clang -Wl,--allow-undefined -DUNISOCKETS_WITH_ALIAS --sysroot=/opt/wasi-sdk-12.0/share/wasi-sysroot cmd/c_echo_server/main.c -o out/c/echo_server_original.wasm && wasm-opt --asyncify -O out/c/echo_server_original.wasm -o out/c/echo_server.wasm'
build-server-wasm-jssi-go:
	@docker run -v ${PWD}:/src:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /src && go build -o out/go/echo_server.wasm ./cmd/go_echo_server/main.go'
build-server-wasm-wasi-tinygo:
	@docker run -v ${PWD}:/src:z tinygo/tinygo sh -c 'cd /src && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DUNISOCKETS_WITH_CUSTOM_ARPA_INET" -target wasi -o out/tinygo/echo_server_wasi_original.wasm ./cmd/go_echo_server/main.go'
	@docker run -v ${PWD}:/src:z alphahorizonio/wasi-sdk sh -c 'cd /src && wasm-opt --asyncify -O out/tinygo/echo_server_wasi_original.wasm -o out/tinygo/echo_server_wasi.wasm'
build-server-wasm-jssi-tinygo:
	@docker run -v ${PWD}:/src:z tinygo/tinygo sh -c 'cd /src && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DUNISOCKETS_WITH_CUSTOM_ARPA_INET" -target wasm -o out/tinygo/echo_server_jssi.wasm ./cmd/go_echo_server/main.go'

build-client-native-posix-c:
	@docker run -v ${PWD}:/src:z silkeh/clang sh -c 'cd /src && mkdir -p out/c && clang ./cmd/c_echo_client/main.c -o out/c/echo_client'
build-client-native-posix-go:
	@docker run -v ${PWD}:/src:z golang sh -c 'cd /src && go build -o out/go/echo_client ./cmd/go_echo_client/main.go'
build-client-native-posix-tinygo:
	@docker run -v ${PWD}:/src:z tinygo/tinygo sh -c 'cd /src && mkdir -p out/tinygo && tinygo build -o out/tinygo/echo_client ./cmd/go_echo_client/main.go'
build-client-wasm-wasi-c:
	@docker run -v ${PWD}:/src:z alphahorizonio/wasi-sdk sh -c 'cd /src && mkdir -p out/c && clang -Wl,--allow-undefined -DUNISOCKETS_WITH_ALIAS --sysroot=/opt/wasi-sdk-12.0/share/wasi-sysroot cmd/c_echo_client/main.c -o out/c/echo_client_original.wasm && wasm-opt --asyncify -O out/c/echo_client_original.wasm -o out/c/echo_client.wasm'
build-client-wasm-jssi-go:
	@docker run -v ${PWD}:/src:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /src && go build -o out/go/echo_client.wasm ./cmd/go_echo_client/main.go'
build-client-wasm-wasi-tinygo:
	@docker run -v ${PWD}:/src:z tinygo/tinygo sh -c 'cd /src && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DUNISOCKETS_WITH_CUSTOM_ARPA_INET" -target wasi -o out/tinygo/echo_client_wasi_original.wasm ./cmd/go_echo_client/main.go'
	@docker run -v ${PWD}:/src:z alphahorizonio/wasi-sdk sh -c 'cd /src && wasm-opt --asyncify -O out/tinygo/echo_client_wasi_original.wasm -o out/tinygo/echo_client_wasi.wasm'
build-client-wasm-jssi-tinygo:
	@docker run -v ${PWD}:/src:z tinygo/tinygo sh -c 'cd /src && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DUNISOCKETS_WITH_CUSTOM_ARPA_INET" -target wasm -o out/tinygo/echo_client_jssi.wasm ./cmd/go_echo_client/main.go'

# Clean
clean: \
    clean-server-native-posix-c \
    clean-server-native-posix-go \
    clean-server-native-posix-tinygo \
    clean-server-wasm-wasi-c \
    clean-server-wasm-jssi-go \
    clean-server-wasm-wasi-tinygo \
    clean-server-wasm-jssi-tinygo \
	clean-client-native-posix-c \
    clean-client-native-posix-go \
    clean-client-native-posix-tinygo \
    clean-client-wasm-wasi-c \
    clean-client-wasm-jssi-go \
    clean-client-wasm-wasi-tinygo \
    clean-client-wasm-jssi-tinygo

clean-server-native-posix-c:
	@rm -f out/c/echo_server
clean-server-native-posix-go:
	@rm -f out/go/echo_server
clean-server-native-posix-tinygo:
	@rm -f out/tinygo/echo_server
clean-server-wasm-wasi-c:
	@rm -f out/c/echo_server_original.wasm
	@rm -f out/c/echo_server.wasm
clean-server-wasm-jssi-go:
	@rm -f out/go/echo_server.wasm
clean-server-wasm-wasi-tinygo:
	@rm -f out/tinygo/echo_server_wasi_original.wasm
	@rm -f out/tinygo/echo_server_wasi.wasm
clean-server-wasm-jssi-tinygo:
	@rm -f out/tinygo/echo_server_jssi.wasm

clean-client-native-posix-c:
	@rm -f out/c/echo_client
clean-client-native-posix-go:
	@rm -f out/go/echo_client
clean-client-native-posix-tinygo:
	@rm -f out/tinygo/echo_client
clean-client-wasm-wasi-c:
	@rm -f out/c/echo_client_original.wasm
	@rm -f out/c/echo_client.wasm
clean-client-wasm-jssi-go:
	@rm -f out/go/echo_client.wasm
clean-client-wasm-wasi-tinygo:
	@rm -f out/tinygo/echo_client_wasi_original.wasm
	@rm -f out/tinygo/echo_client_wasi.wasm
clean-client-wasm-jssi-tinygo:
	@rm -f out/tinygo/echo_client_jssi.wasm

# Run
run: \
	run-signaling-server \
    run-server-native-posix-c \
    run-server-native-posix-go \
    run-server-native-posix-tinygo \
	run-server-wasm-wasi-c \
	run-server-wasm-jssi-go \
	run-server-wasm-wasi-tinygo \
	run-server-wasm-jssi-tinygo \
	run-client-native-posix-c \
    run-client-native-posix-go \
    run-client-native-posix-tinygo \
	run-client-wasm-wasi-c \
	run-client-wasm-jssi-go \
	run-client-wasm-wasi-tinygo \
	run-client-wasm-jssi-tinygo

run-signaling-server: build-unisockets-runner
	@docker run --net host -v ${PWD}:/src:z alphahorizonio/unisockets-runner sh -c 'cd /src && unisockets_runner --runSignalingServer true'

run-server-native-posix-c:
	@./out/c/echo_server
run-server-native-posix-go:
	@./out/go/echo_server
run-server-native-posix-tinygo:
	@./out/tinygo/echo_server
run-server-wasm-wasi-c:
	@docker run --net host -v ${PWD}:/src:z alphahorizonio/unisockets-runner sh -c 'cd /src && unisockets_runner --runBinary true --useC true --useWASI true --binaryPath ./out/c/echo_server.wasm'
run-server-wasm-jssi-go:
	@docker run --net host -v ${PWD}:/src:z alphahorizonio/unisockets-runner sh -c 'cd /src && unisockets_runner --runBinary true --useGo true --useJSSI true --binaryPath ./out/go/echo_server.wasm'
run-server-wasm-wasi-tiny:
	@docker run --net host -v ${PWD}:/src:z alphahorizonio/unisockets-runner sh -c 'cd /src && unisockets_runner --runBinary true --useTinyGo true --useWASI true --binaryPath ./out/tinygo/echo_server_wasi.wasm'
run-server-wasm-jssi-tinygo:
	@docker run --net host -v ${PWD}:/src:z alphahorizonio/unisockets-runner sh -c 'cd /src && unisockets_runner --runBinary true --useTinyGo true --useJSSI true --binaryPath ./out/tinygo/echo_server_wasi.wasm'

run-client-native-posix-c:
	@./out/c/echo_client
run-client-native-posix-go:
	@./out/go/echo_client
run-client-native-posix-tinygo:
	@./out/tinygo/echo_client
run-client-wasm-wasi-c:
	@docker run --net host -v ${PWD}:/src:z alphahorizonio/unisockets-runner sh -c 'cd /src && unisockets_runner --runBinary true --useC true --useWASI true --binaryPath ./out/c/echo_client.wasm'
run-client-wasm-jssi-go:
	@docker run --net host -v ${PWD}:/src:z alphahorizonio/unisockets-runner sh -c 'cd /src && unisockets_runner --runBinary true --useGo true --useJSSI true --binaryPath ./out/go/echo_client.wasm'
run-client-wasm-wasi-tiny:
	@docker run --net host -v ${PWD}:/src:z alphahorizonio/unisockets-runner sh -c 'cd /src && unisockets_runner --runBinary true --useTinyGo true --useWASI true --binaryPath ./out/tinygo/echo_client_wasi.wasm'
run-client-wasm-jssi-tinygo:
	@docker run --net host -v ${PWD}:/src:z alphahorizonio/unisockets-runner sh -c 'cd /src && unisockets_runner --runBinary true --useTinyGo true --useJSSI true --binaryPath ./out/tinygo/echo_client_wasi.wasm'
