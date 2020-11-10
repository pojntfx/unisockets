# All
all: build

# Build
build: \
	build-container-wasi-sdk \
	build-client_example-wasm \
	build-client_example-native \
	build-server_example-wasm \
	build-server_example-native

build-container-wasi-sdk:
	@docker build -t pojntfx/wasi-sdk src

build-client_example-wasm: build-container-wasi-sdk
	@docker run -v ${PWD}/src:/src:Z pojntfx/wasi-sdk sh -c 'cd /src && clang -Wl,--allow-undefined -DIS_WASM --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot client_example.c -o client_example_original.wasm && wasm-opt --asyncify -O client_example_original.wasm -o client_example.wasm'
build-client_example-native:
	@docker run -v ${PWD}/src:/src:Z silkeh/clang sh -c 'cd /src && clang client_example.c -o client_example'

build-server_example-wasm: build-container-wasi-sdk
	@docker run -v ${PWD}/src:/src:Z pojntfx/wasi-sdk sh -c 'cd /src && clang -Wl,--allow-undefined -DIS_WASM --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot server_example.c -o server_example_original.wasm && wasm-opt --asyncify -O server_example_original.wasm -o server_example.wasm'
build-server_example-native:
	@docker run -v ${PWD}/src:/src:Z silkeh/clang sh -c 'cd /src && clang server_example.c -o server_example'

# Clean
clean: \
	clean-client_example-wasm \
	clean-client_example-native \
	clean-server_example-wasm \
	clean-server_example-native

clean-client_example-wasm:
	@rm -f src/client_example.wasm
clean-client_example-native:
	@rm -f src/client_example

clean-server_example-wasm:
	@rm -f src/server_example.wasm
clean-server_example-native:
	@rm -f src/server_example

# Test
test: \
	test-client_example-wasm \
	test-client_example-native \
	test-server_example-wasm \
	test-server_example-native \
	test-client_server_example-wasm \
	test-webrtc_client_example-wasm \
	test-webrtc_server_example-wasm \
	test-signaling_server \
	test-signaling_client \
	test-comm_client

test-client_example-wasm:
	yarn test:client_example
test-client_example-native:
	./src/client_example

test-server_example-wasm:
	yarn test:server_example
test-server_example-native:
	./src/server_example

test-client_server_example-wasm:
	yarn test:client_server_example

test-webrtc_client_example-wasm:
	yarn test:webrtc_client_example
test-webrtc_server_example-wasm:
	yarn test:webrtc_server_example

test-signaling_server:
	yarn test:signaling_server
test-signaling_client:
	yarn test:signaling_client

test-comm_client:
	yarn test:comm_client