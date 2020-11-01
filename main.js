"use strict";
const fs = require("fs");
const { WASI } = require("wasi");
const wasi = new WASI();
const importObject = { wasi_snapshot_preview1: wasi.wasiImport };

(async () => {
  const wasm = await WebAssembly.compile(fs.readFileSync("./memaccess.wasm"));
  const instance = await WebAssembly.instantiate(wasm, {
    ...importObject,
    env: {
      get_num_from_runtime: () => 5,
    },
  });

  wasi.start(instance);
})();
