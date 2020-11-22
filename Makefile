# All
all: build

# Build
build: \
	build-container-wasi-sdk \
	build-echo_client-wasm \
	build-echo_client-native \
	build-echo_server-wasm \
	build-echo_server-native

build-container-wasi-sdk:
	@docker build -t pojntfx/wasi-sdk examples

build-echo_client-wasm: build-container-wasi-sdk
	@docker run -v ${PWD}/examples:/examples:Z pojntfx/wasi-sdk sh -c 'cd /examples && clang -Wl,--allow-undefined -DIS_WASM --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot echo_client.c -o echo_client_original.wasm && wasm-opt --asyncify -O echo_client_original.wasm -o echo_client.wasm'
build-echo_client-native:
	@docker run -v ${PWD}/examples:/examples:Z silkeh/clang sh -c 'cd /examples && clang echo_client.c -o echo_client'

build-echo_server-wasm: build-container-wasi-sdk
	@docker run -v ${PWD}/examples:/examples:Z pojntfx/wasi-sdk sh -c 'cd /examples && clang -Wl,--allow-undefined -DIS_WASM --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot echo_server.c -o echo_server_original.wasm && wasm-opt --asyncify -O echo_server_original.wasm -o echo_server.wasm'
build-echo_server-native:
	@docker run -v ${PWD}/examples:/examples:Z silkeh/clang sh -c 'cd /examples && clang echo_server.c -o echo_server'

# Clean
clean: \
	clean-echo_client-wasm \
	clean-echo_client-native \
	clean-echo_server-wasm \
	clean-echo_server-native

clean-echo_client-wasm:
	@rm -f examples/echo_client.wasm
clean-echo_client-native:
	@rm -f examples/echo_client

clean-echo_server-wasm:
	@rm -f examples/echo_server.wasm
clean-echo_server-native:
	@rm -f examples/echo_server

# Test
test: \
	test-echo_client-native \
	test-echo_server-native

test-echo_client-native:
	./examples/echo_client
test-echo_server-native:
	./examples/echo_server