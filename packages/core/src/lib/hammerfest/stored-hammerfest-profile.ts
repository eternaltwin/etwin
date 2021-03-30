import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean.js";
import { $Date } from "kryo/lib/date.js";
import { $Uint32 } from "kryo/lib/integer.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $HammerfestItemUnlocks, HammerfestItemUnlocks } from "./hammerfest-item-unlocks.js";
import { $HammerfestQuestStatusMap, HammerfestQuestStatusMap } from "./hammerfest-quest-status-map.js";

export interface StoredHammerfestProfile {
  firstArchivedAt: Date;
  lastArchivedAt: Date;
  bestScore: number;
  bestLevel: number;
  gameCompleted: boolean;
  items: HammerfestItemUnlocks;
  quests: HammerfestQuestStatusMap;
}

export const $StoredHammerfestProfile: RecordIoType<StoredHammerfestProfile> = new RecordType<StoredHammerfestProfile>({
  properties: {
    firstArchivedAt: {type: $Date},
    lastArchivedAt: {type: $Date},
    bestScore: {type: $Uint32},
    bestLevel: {type: $Uint32},
    gameCompleted: {type: $Boolean},
    items: {type: $HammerfestItemUnlocks},
    quests: {type: $HammerfestQuestStatusMap},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableStoredHammerfestProfile = null | StoredHammerfestProfile;

export const $NullableStoredHammerfestProfile: TryUnionType<NullableStoredHammerfestProfile> = new TryUnionType({variants: [$Null, $StoredHammerfestProfile]});
