import dts from "rollup-plugin-dts";
import esbuild from "rollup-plugin-esbuild";
import { main, module, source, types } from "./package.json";

const bundle = (format) => ({
  input: source,
  output: {
    file: format == "cjs" ? main : format == "dts" ? types : module,
    format: format == "cjs" ? "cjs" : "es",
    sourcemap: format != "dts",
  },
  plugins: format == "dts" ? [dts()] : [esbuild()],
  external: (id) => !/^[./]/.test(id),
});

export default [bundle("es"), bundle("cjs"), bundle("dts")];
