export const htons = (val: number) => ((val & 0xff) << 8) | ((val >> 8) & 0xff);
