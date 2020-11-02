# All
all: build

# Build
build: \
	build-container-wasi-sdk \
	build-client_example

build-container-wasi-sdk:
	@docker build -t pojntfx/wasi-sdk src

build-client_example: build-container-wasi-sdk
	@docker run -v ${PWD}/src:/src:Z pojntfx/wasi-sdk sh -c 'cd /src && clang -Wl,--allow-undefined --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot client_example.c -o client_example.wasm'

# Clean
clean: \
	clean-client_example

clean-client_example:
	@rm -f src/client_example.wasm

# Test
test: \
	test-client_example

test-client_example:
	@yarn test:client_example
