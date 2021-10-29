import { $Boolean } from "kryo/boolean";
import { MapType } from "kryo/map";

import { $HammerfestItemId, HammerfestItemId } from "./hammerfest-item-id.mjs";

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
