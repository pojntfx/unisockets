export const getUint2 = (val: number) => {
  const valInMemory = new ArrayBuffer(4);

  new Int32Array(valInMemory)[0] = val;

  return Array.from(new Uint8Array(valInMemory));
};
