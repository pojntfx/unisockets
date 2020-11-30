declare module "asyncify-wasm" {
  declare async function instantiate(
    binary: WebAssembly.Module,
    imports: any
  ): Promise<any>;
}
