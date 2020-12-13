import dts from "rollup-plugin-dts";
import esbuild from "rollup-plugin-esbuild";
import hashbang from "rollup-plugin-hashbang";
import {
  main,
  module,
  source,
  types,
  binSource,
  binMain,
} from "./package.json";

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

const bundleBin = () => ({
  input: binSource,
  output: {
    file: binMain,
    format: "cjs",
    sourcemap: false,
  },
  plugins: [esbuild(), hashbang()],
  external: (id) => !/^[./]/.test(id),
});

export default [bundle("es"), bundle("cjs"), bundle("dts"), bundleBin()];
