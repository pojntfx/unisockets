import esbuild from "rollup-plugin-esbuild";
import { main, module, source } from "./package.json";

const bundle = (format) => ({
  input: source,
  output: {
    file: format == "cjs" ? main : module,
    format: format == "cjs" ? "cjs" : "es",
  },
  plugins: [esbuild()],
  external: (id) => !/^[./]/.test(id),
});

export default [bundle("js"), bundle("cjs")];
