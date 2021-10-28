import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/boolean";
import { $Date } from "kryo/date";
import { $Uint32 } from "kryo/integer";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $HammerfestItemUnlocks, HammerfestItemUnlocks } from "./hammerfest-item-unlocks.mjs";
import { $HammerfestQuestStatusMap, HammerfestQuestStatusMap } from "./hammerfest-quest-status-map.mjs";

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
