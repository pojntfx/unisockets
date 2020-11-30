# All
all: build

# Build
build: \
    build-wasi-sdk \
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

build-wasi-sdk:
	@docker build -t pojntfx/wasi-sdk cmd/c_echo_client

build-server-native-posix-c:
	@docker run -v ${PWD}/cmd:/cmd:z silkeh/clang sh -c 'cd /cmd/c_echo_server && mkdir -p out && clang main.c -o out/echo_server'

build-server-native-posix-go:
	@docker run -v ${PWD}/cmd:/cmd:z golang sh -c 'cd /cmd/go_echo_server && go build -o out/go/echo_server main.go'

build-server-native-posix-tinygo:
	@docker run -v ${PWD}/cmd:/cmd:z tinygo/tinygo sh -c 'cd /cmd/go_echo_server && mkdir -p out/tinygo && tinygo build -o out/tinygo/echo_server main.go'

build-server-wasm-wasi-c: build-wasi-sdk
	@docker run -v ${PWD}/cmd:/cmd:z pojntfx/wasi-sdk sh -c 'cd /cmd/c_echo_server && mkdir -p out && clang -Wl,--allow-undefined -DIS_WASM -DBERKELEY_SOCKETS_WITH_ALIAS --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot main.c -o out/echo_server_original.wasm && wasm-opt --asyncify -O out/echo_server_original.wasm -o out/echo_server.wasm'

build-server-wasm-jssi-go:
	@docker run -v ${PWD}/cmd:/cmd:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /cmd/go_echo_server && go build -o out/go/echo_server.wasm main.go'

build-server-wasm-wasi-tinygo: build-wasi-sdk
	@docker run -v ${PWD}/cmd:/cmd:z tinygo/tinygo sh -c 'cd /cmd/go_echo_server && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasi -o out/tinygo/echo_server_wasi_original.wasm main.go'
	@docker run -v ${PWD}/cmd:/cmd:z pojntfx/wasi-sdk sh -c 'cd /cmd/go_echo_server && wasm-opt --asyncify -O out/tinygo/echo_server_wasi_original.wasm -o out/tinygo/echo_server_wasi.wasm'

build-server-wasm-jssi-tinygo:
	@docker run -v ${PWD}/cmd:/cmd:z tinygo/tinygo sh -c 'cd /cmd/go_echo_server && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasm -o out/tinygo/echo_server.wasm main.go'

build-client-native-posix-c:
	@docker run -v ${PWD}/cmd:/cmd:z silkeh/clang sh -c 'cd /cmd/c_echo_client && mkdir -p out && clang main.c -o out/echo_client'

build-client-native-posix-go:
	@docker run -v ${PWD}/cmd:/cmd:z golang sh -c 'cd /cmd/go_echo_client && go build -o out/go/echo_client main.go'

build-client-native-posix-tinygo:
	@docker run -v ${PWD}/cmd:/cmd:z tinygo/tinygo sh -c 'cd /cmd/go_echo_client && mkdir -p out/tinygo && tinygo build -o out/tinygo/echo_client main.go'

build-client-wasm-wasi-c: build-wasi-sdk
	@docker run -v ${PWD}/cmd:/cmd:z pojntfx/wasi-sdk sh -c 'cd /cmd/c_echo_client && mkdir -p out && clang -Wl,--allow-undefined -DIS_WASM -DBERKELEY_SOCKETS_WITH_ALIAS --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot main.c -o out/echo_client_original.wasm && wasm-opt --asyncify -O out/echo_client_original.wasm -o out/echo_client.wasm'

build-client-wasm-jssi-go:
	@docker run -v ${PWD}/cmd:/cmd:z -e GOOS=js -e GOARCH=wasm golang sh -c 'cd /cmd/go_echo_client && go build -o out/go/echo_client.wasm main.go'

build-client-wasm-wasi-tinygo: build-wasi-sdk
	@docker run -v ${PWD}/cmd:/cmd:z tinygo/tinygo sh -c 'cd /cmd/go_echo_client && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasi -o out/tinygo/echo_client_wasi_original.wasm main.go'
	@docker run -v ${PWD}/cmd:/cmd:z pojntfx/wasi-sdk sh -c 'cd /cmd/go_echo_client && wasm-opt --asyncify -O out/tinygo/echo_client_wasi_original.wasm -o out/tinygo/echo_client_wasi.wasm'

build-client-wasm-jssi-tinygo:
	@docker run -v ${PWD}/cmd:/cmd:z tinygo/tinygo sh -c 'cd /cmd/go_echo_client && mkdir -p out/tinygo && tinygo build -heap-size 20M -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasm -o out/tinygo/echo_client.wasm main.go'

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
	@rm -f cmd/c_echo_server/out/echo_server

clean-server-native-posix-go:
	@rm -f cmd/go_echo_server/out/go/echo_server

clean-server-native-posix-tinygo:
	@rm -f cmd/go_echo_server/out/tinygo/echo_server

clean-server-wasm-wasi-c:
	@rm -f cmd/c_echo_server/out/echo_server_original.wasm
	@rm -f cmd/c_echo_server/out/echo_server.wasm

clean-server-wasm-jssi-go:
	@rm -f cmd/go_echo_server/out/go/echo_server.wasm

clean-server-wasm-wasi-tinygo:
	@rm -f cmd/go_echo_server/out/tinygo/echo_server_wasi_original.wasm
	@rm -f cmd/go_echo_server/out/tinygo/echo_server_wasi.wasm

clean-server-wasm-jssi-tinygo:
	@rm -f cmd/go_echo_server/out/tinygo/echo_server.wasm

clean-client-native-posix-c:
	@rm -f cmd/c_echo_client/out/echo_client

clean-client-native-posix-go:
	@rm -f cmd/go_echo_client/out/go/echo_client

clean-client-native-posix-tinygo:
	@rm -f cmd/go_echo_client/out/tinygo/echo_client

clean-client-wasm-wasi-c:
	@rm -f cmd/c_echo_client/out/echo_client_original.wasm
	@rm -f cmd/c_echo_client/out/echo_client.wasm

clean-client-wasm-jssi-go:
	@rm -f cmd/go_echo_client/out/go/echo_client.wasm

clean-client-wasm-wasi-tinygo:
	@rm -f cmd/go_echo_client/out/tinygo/echo_client_wasi_original.wasm
	@rm -f cmd/go_echo_client/out/tinygo/echo_client_wasi.wasm

clean-client-wasm-jssi-tinygo:
	@rm -f cmd/go_echo_client/out/tinygo/echo_client.wasm

# Run
run: \
    run-server-native-posix-c \
    run-server-native-posix-go \
    run-server-native-posix-tinygo \
	run-client-native-posix-c \
    run-client-native-posix-go \
    run-client-native-posix-tinygo

run-server-native-posix-c:
	@./cmd/c_echo_server/out/echo_server

run-server-native-posix-go:
	@./cmd/go_echo_server/out/go/echo_server

run-server-native-posix-tinygo:
	@./cmd/go_echo_server/out/tinygo/echo_server

run-client-native-posix-c:
	@./cmd/c_echo_client/out/echo_client

run-client-native-posix-go:
	@./cmd/go_echo_client/out/go/echo_client

run-client-native-posix-tinygo:
	@./cmd/go_echo_client/out/tinygo/echo_client