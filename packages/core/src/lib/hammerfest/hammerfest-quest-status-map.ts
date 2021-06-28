import { VersionedType } from "kryo";
import { MapType } from "kryo/lib/map";

import { $HammerfestQuestId, HammerfestQuestId } from "./hammerfest-quest-id.js";
import { $HammerfestQuestStatus, HammerfestQuestStatus } from "./hammerfest-quest-status.js";

export type HammerfestQuestStatusMap = Map<HammerfestQuestId, HammerfestQuestStatus>;

export const $HammerfestQuestStatusMap: MapType<HammerfestQuestId, HammerfestQuestStatus> = new MapType({
  keyType: $HammerfestQuestId,
  valueType: $HammerfestQuestStatus as unknown as VersionedType<HammerfestQuestStatus, {}>,
  maxSize: 100,
  assumeStringKey: true,
});
