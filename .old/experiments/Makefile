# All
all: build

# Build
build: \
	build-container-wasi-sdk \
	build-memaccess \
	build-client_wasm

build-container-wasi-sdk:
	@docker build -t pojntfx/wasi-sdk .

build-memaccess: build-container-wasi-sdk
	@docker run -v ${PWD}:/src:Z pojntfx/wasi-sdk sh -c 'cd /src && clang -Wl,--allow-undefined --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot memaccess.c -o memaccess.wasm'

build-client_wasm: build-container-wasi-sdk
	@docker run -v ${PWD}:/src:Z pojntfx/wasi-sdk sh -c 'cd /src && clang -Wl,--allow-undefined --sysroot=/opt/wasi-sdk-11.0/share/wasi-sysroot client_wasm.c -o client_wasm.wasm'

# Clean
clean: \
	clean-memaccess \
	clean-client_wasm \

clean-memaccess:
	@rm -rf memaccess.wasm

clean-client_wasm:
	@rm -rf client_wasm.wasm

# Run
run: \
	run-memaccess \
	run-client_wasm-interpreter \
	run-memaccess-interpreter

run-memaccess:
	@wasmtime run memaccess.wasm

run-client_wasm-interpreter:
	@node --experimental-wasi-unstable-preview1 client_wasm.js

run-memaccess-interpreter:
	@node --experimental-wasi-unstable-preview1 memaccess.js