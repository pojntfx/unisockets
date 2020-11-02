# All
all: build

# Build
build: \
	build-container-wasi-sdk \
	build-client_example-wasm \
	build-client_example-native

build-container-wasi-sdk:
	@docker build -t pojntfx/wasi-sdk src

build-client_example-wasm: build-container-wasi-sdk
	@docker run -v ${PWD}/src:/src:Z pojntfx/wasi-sdk sh -c 'cd /src && clang -Wl,--allow-undefined -DIS_WASM --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot client_example.c -o client_example.wasm'

build-client_example-native:
	@docker run -v ${PWD}/src:/src:Z silkeh/clang sh -c 'cd /src && clang client_example.c -o client_example'

# Clean
clean: \
	clean-client_example-wasm \
	clean-client_example-native

clean-client_example-wasm:
	@rm -f src/client_example.wasm

clean-client_example-native:
	@rm -f src/client_example

# Test
test: \
	test-client_example-wasm \
	test-client_example-native

test-client_example-wasm:
	yarn test:client_example

test-client_example-native:
	./src/client_example