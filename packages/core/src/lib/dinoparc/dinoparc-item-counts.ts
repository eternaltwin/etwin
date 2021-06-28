import { $Uint32 } from "kryo/lib/integer";
import { MapType } from "kryo/lib/map";

import { $DinoparcItemId, DinoparcItemId } from "./dinoparc-item-id.js";

export type DinoparcItemCounts = Map<DinoparcItemId, number>;

export const $DinoparcItemCounts: MapType<DinoparcItemId, number> = new MapType({
  keyType: $DinoparcItemId,
  valueType: $Uint32,
  maxSize: 1000,
  assumeStringKey: true,
});
