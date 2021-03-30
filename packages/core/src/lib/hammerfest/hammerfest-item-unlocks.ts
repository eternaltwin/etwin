import { $Boolean } from "kryo/lib/boolean.js";
import { MapType } from "kryo/lib/map.js";

import { $HammerfestItemId, HammerfestItemId } from "./hammerfest-item-id.js";

/**
 * A map of Hammerfest item unlocks.
 */
export type HammerfestItemUnlocks = Map<HammerfestItemId, boolean>;

export const $HammerfestItemUnlocks: MapType<HammerfestItemId, boolean> = new MapType({
  keyType: $HammerfestItemId,
  valueType: $Boolean,
  maxSize: 500,
  assumeStringKey: true,
});
