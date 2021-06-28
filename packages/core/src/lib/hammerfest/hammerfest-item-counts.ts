import { $Uint32 } from "kryo/lib/integer";
import { MapType } from "kryo/lib/map";

import { $HammerfestItemId, HammerfestItemId } from "./hammerfest-item-id.js";

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
