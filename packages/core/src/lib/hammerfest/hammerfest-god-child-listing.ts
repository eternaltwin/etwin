import { ArrayIoType,ArrayType } from "kryo/lib/array.js";

import { $HammerfestGodChild, HammerfestGodChild } from "./hammerfest-god-child.js";


export type HammerfestGodChildListing = HammerfestGodChild[];

export const $HammerfestGodChildListing: ArrayIoType<HammerfestGodChild> = new ArrayType<HammerfestGodChild>({
  itemType: $HammerfestGodChild,
  maxLength: 100,
});
