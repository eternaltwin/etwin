import { VersionedType } from "kryo";
import { MapType } from "kryo/map";

import { $HammerfestQuestId, HammerfestQuestId } from "./hammerfest-quest-id.mjs";
import { $HammerfestQuestStatus, HammerfestQuestStatus } from "./hammerfest-quest-status.mjs";

export type HammerfestQuestStatusMap = Map<HammerfestQuestId, HammerfestQuestStatus>;

export const $HammerfestQuestStatusMap: MapType<HammerfestQuestId, HammerfestQuestStatus> = new MapType({
  keyType: $HammerfestQuestId,
  valueType: $HammerfestQuestStatus as unknown as VersionedType<HammerfestQuestStatus, {}>,
  maxSize: 100,
  assumeStringKey: true,
});
