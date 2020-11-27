# All
all: build

# Build
build: \
	build-container-wasi-sdk \
	build-c-echo_client-wasm \
	build-c-echo_client-native \
	build-c-echo_server-wasm \
	build-c-echo_server-native \
	build-go-echo_client-native \
	build-go-echo_server-native \
    build-tinygo-echo_client-wasm \
	build-tinygo-echo_server-wasm \
	build-tinygo-async_echo_server-wasm

build-container-wasi-sdk:
	@docker build -t pojntfx/wasi-sdk examples/c

build-c-echo_client-wasm: build-container-wasi-sdk
	@docker run -v ${PWD}/examples/c:/examples/c:z pojntfx/wasi-sdk sh -c 'cd /examples/c && clang -Wl,--allow-undefined -DIS_WASM -DBERKELEY_SOCKETS_WITH_ALIAS --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot echo_client.c -o echo_client_original.wasm && wasm-opt --asyncify -O echo_client_original.wasm -o echo_client.wasm'
build-c-echo_client-native:
	@docker run -v ${PWD}/examples/c:/examples/c:z silkeh/clang sh -c 'cd /examples/c && clang echo_client.c -o echo_client'

build-c-echo_server-wasm: build-container-wasi-sdk
	@docker run -v ${PWD}/examples/c:/examples/c:z pojntfx/wasi-sdk sh -c 'cd /examples/c && clang -Wl,--allow-undefined -DIS_WASM -DBERKELEY_SOCKETS_WITH_ALIAS --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot echo_server.c -o echo_server_original.wasm && wasm-opt --asyncify -O echo_server_original.wasm -o echo_server.wasm'
build-c-echo_server-native:
	@docker run -v ${PWD}/examples/c:/examples/c:z silkeh/clang sh -c 'cd /examples/c && clang echo_server.c -o echo_server'

build-go-echo_client-native:
	@docker run -v ${PWD}/examples/go:/examples/go:z golang sh -c 'cd /examples/go && go build -o echo_client ./cmd/echo-client/main.go'
build-go-echo_server-native:
	@docker run -v ${PWD}/examples/go:/examples/go:z golang sh -c 'cd /examples/go && go build -o echo_server ./cmd/echo-server/main.go'

build-tinygo-echo_client-wasm: build-container-wasi-sdk
	@docker run -v ${PWD}/examples/tinygo:/examples/tinygo:z tinygo/tinygo sh -c 'cd /examples/tinygo && tinygo build -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasm -o echo_client_original.wasm ./cmd/echo-client/main.go'
	@docker run -v ${PWD}/examples/tinygo:/examples/tinygo:z pojntfx/wasi-sdk sh -c 'cd /examples/tinygo && wasm-opt --asyncify -O echo_client_original.wasm -o echo_client.wasm'
build-tinygo-echo_server-wasm: build-container-wasi-sdk
	@docker run -v ${PWD}/examples/tinygo:/examples/tinygo:z tinygo/tinygo sh -c 'cd /examples/tinygo && tinygo build -cflags "-DBERKELEY_SOCKETS_WITH_CUSTOM_ARPA_INET" -target wasm -o echo_server_original.wasm ./cmd/echo-server/main.go'
	@docker run -v ${PWD}/examples/tinygo:/examples/tinygo:z pojntfx/wasi-sdk sh -c 'cd /examples/tinygo && wasm-opt --asyncify -O echo_server_original.wasm -o echo_server.wasm'

build-tinygo-async_echo_server-wasm: build-container-wasi-sdk
	@docker run -v ${PWD}/examples/tinygo:/examples/tinygo:z tinygo/tinygo sh -c 'cd /examples/tinygo && tinygo build -target wasm -o async_echo_server.wasm ./cmd/async-echo-server/main.go'

# Clean
clean: \
	clean-c-echo_client-wasm \
	clean-c-echo_client-native \
	clean-c-echo_server-wasm \
	clean-c-echo_server-native \
	clean-go-echo_client-native \
	clean-go-echo_server-native \
	clean-tinygo-echo_client-wasm \
	clean-tinygo-echo_server-wasm \
	clean-tinygo-async_echo_server-wasm

clean-c-echo_client-wasm:
	@rm -f examples/c/echo_client*.wasm
clean-c-echo_client-native:
	@rm -f examples/c/echo_client

clean-c-echo_server-wasm:
	@rm -f examples/c/echo_server*.wasm
clean-c-echo_server-native:
	@rm -f examples/c/echo_server

clean-go-echo_client-native:
	@rm -f examples/go/echo_client
clean-go-echo_server-native:
	@rm -f examples/go/echo_server

clean-tinygo-echo_client-wasm:
	@rm -f examples/tinygo/echo_client*.wasm
clean-tinygo-echo_server-wasm:
	@rm -f examples/tinygo/echo_server*.wasm

clean-tinygo-async_echo_server-wasm:
	@rm -f examples/tinygo/async_echo_server*.wasm

# Test
test: \
	test-c-echo_client-native \
	test-c-echo_server-native \
	test-go-echo_client-native \
	test-go-echo_server-native

test-c-echo_client-native:
	@./examples/c/echo_client
test-c-echo_server-native:
	@./examples/c/echo_server

test-go-echo_client-native:
	@./examples/go/echo_client
test-go-echo_server-native:
	@./examples/go/echo_server