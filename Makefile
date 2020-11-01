# All
all: build

# Build
build: \
	build-container-wasi-sdk \
	build-memaccess \

build-container-wasi-sdk:
	@docker build -t pojntfx/wasi-sdk .

build-memaccess: build-container-wasi-sdk
	@docker run -v ${PWD}:/src:Z pojntfx/wasi-sdk sh -c 'cd /src && clang --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot memaccess.c -o memaccess.wasm'

# Clean
clean: \
	clean-memaccess \

clean-memaccess:
	@rm -rf memaccess.wasm

# Run
run: \
	run-memaccess \
	run-interpreter

run-memaccess:
	@wasmtime run memaccess.wasm

run-interpreter:
	@node --experimental-wasi-unstable-preview1 main.js