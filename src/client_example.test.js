import fs from "fs";
import { WASI } from "wasi";

(async () => {
  const wasi = new WASI();

  const wasm = await WebAssembly.compile(
    fs.readFileSync(__dirname + "/client_example.wasm")
  );

  const instance = await WebAssembly.instantiate(wasm, {
    wasi_snapshot_preview1: wasi.wasiImport,
  });

  wasi.start(instance);
})();
