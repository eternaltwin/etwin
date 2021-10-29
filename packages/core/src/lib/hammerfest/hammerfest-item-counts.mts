import { $Uint32 } from "kryo/integer";
import { MapType } from "kryo/map";

import { $HammerfestItemId, HammerfestItemId } from "./hammerfest-item-id.mjs";

/**
 * A map of Hammerfest item counts.
 */
export type HammerfestItemCounts = Map<HammerfestItemId, number>;

export const $HammerfestItemCounts: MapType<HammerfestItemId, number> = new MapType({
  keyType: $HammerfestItemId,
  valueType: $Uint32,
  maxSize: 500,
  assumeStringKey: true,
});
