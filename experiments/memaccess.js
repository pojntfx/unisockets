const fs = require("fs");
const { WASI } = require("wasi");
const wasi = new WASI();
const importObject = { wasi_snapshot_preview1: wasi.wasiImport };

function swap16(val) {
  return ((val & 0xff) << 8) | ((val >> 8) & 0xff);
}

(async () => {
  const wasm = await WebAssembly.compile(fs.readFileSync("./memaccess.wasm"));
  const instance = await WebAssembly.instantiate(wasm, {
    ...importObject,
    env: {
      transfer_to_runtime: (value, pointer, size) => {
        console.log(
          `(runtime) value=${value} pointer=0x${pointer.toString(
            16
          )} size=${size}`
        );

        const intInMemory = new Uint8Array(
          instance.exports.memory.buffer
        ).slice(pointer, pointer + size);

        console.log(`(memory) value=${new Int32Array(intInMemory.buffer)[0]}`);

        return 0;
      },
      transfer_to_runtime_sockaddr_in: (pointer, size) => {
        console.log(`(runtime) pointer=${pointer} size=${size}`);

        const sockaddrInMemory = new Uint8Array(
          instance.exports.memory.buffer
        ).slice(pointer, pointer + size);

        const sin_family = sockaddrInMemory.slice(0, 2);
        const sin_port = sockaddrInMemory.slice(2, 4);
        const sin_addr = sockaddrInMemory.slice(4, 8);

        console.log(sockaddrInMemory, sin_family, sin_port, sin_addr);

        const family = new Int32Array(sin_family)[0];
        const port = new Uint16Array(sin_port)[0];
        const addr = sin_addr.join(".");

        console.log(
          `(runtime) family=${family} port=${swap16(port)} addr=${addr}`
        );

        return 0;
      },
    },
  });

  wasi.start(instance);
})();
