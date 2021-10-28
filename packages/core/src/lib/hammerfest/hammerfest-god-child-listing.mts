import { ArrayIoType,ArrayType } from "kryo/array";

import { $HammerfestGodChild, HammerfestGodChild } from "./hammerfest-god-child.mjs";


export type HammerfestGodChildListing = HammerfestGodChild[];

export const $HammerfestGodChildListing: ArrayIoType<HammerfestGodChild> = new ArrayType<HammerfestGodChild>({
  itemType: $HammerfestGodChild,
  maxLength: 100,
});
