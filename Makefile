# All
all: build

# Build
build: \
	build-container-wasi-sdk \
	build-c-echo_client-wasm \
	build-c-echo_client-native \
	build-c-echo_server-wasm \
	build-c-echo_server-native

build-container-wasi-sdk:
	@docker build -t pojntfx/wasi-sdk examples/c

build-c-echo_client-wasm: build-container-wasi-sdk
	@docker run -v ${PWD}/examples/c:/examples/c:Z pojntfx/wasi-sdk sh -c 'cd /examples/c && clang -Wl,--allow-undefined -DIS_WASM --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot echo_client.c -o echo_client_original.wasm && wasm-opt --asyncify -O echo_client_original.wasm -o echo_client.wasm'
build-c-echo_client-native:
	@docker run -v ${PWD}/examples/c:/examples/c:Z silkeh/clang sh -c 'cd /examples/c && clang echo_client.c -o echo_client'

build-c-echo_server-wasm: build-container-wasi-sdk
	@docker run -v ${PWD}/examples/c:/examples/c:Z pojntfx/wasi-sdk sh -c 'cd /examples/c && clang -Wl,--allow-undefined -DIS_WASM --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot echo_server.c -o echo_server_original.wasm && wasm-opt --asyncify -O echo_server_original.wasm -o echo_server.wasm'
build-c-echo_server-native:
	@docker run -v ${PWD}/examples/c:/examples/c:Z silkeh/clang sh -c 'cd /examples/c && clang echo_server.c -o echo_server'

# Clean
clean: \
	clean-c-echo_client-wasm \
	clean-c-echo_client-native \
	clean-c-echo_server-wasm \
	clean-c-echo_server-native

clean-c-echo_client-wasm:
	@rm -f examples/c/echo_client*.wasm
clean-c-echo_client-native:
	@rm -f examples/c/echo_client

clean-c-echo_server-wasm:
	@rm -f examples/c/echo_server*.wasm
clean-c-echo_server-native:
	@rm -f examples/c/echo_server

# Test
test: \
	test-c-echo_client-native \
	test-c-echo_server-native

test-c-echo_client-native:
	./examples/c/echo_client
test-c-echo_server-native:
	./examples/c/echo_server