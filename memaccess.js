const fs = require("fs");
const { WASI } = require("wasi");
const wasi = new WASI();
const importObject = { wasi_snapshot_preview1: wasi.wasiImport };

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
    },
  });

  wasi.start(instance);
})();
