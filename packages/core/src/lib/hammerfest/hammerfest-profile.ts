import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array.js";
import { $Boolean } from "kryo/lib/boolean.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $NullableEmailAddress, NullableEmailAddress } from "../email/email-address.js";
import {
  $NullableHammerfestHallOfFameMessage,
  NullableHammerfestHallOfFameMessage
} from "./hammerfest-hall-of-fame-message.js";
import { $HammerfestItemId, HammerfestItemId } from "./hammerfest-item-id.js";
import { $HammerfestLevel, HammerfestLevel } from "./hammerfest-level.js";
import { $HammerfestQuestStatusMap, HammerfestQuestStatusMap } from "./hammerfest-quest-status-map.js";
import { $HammerfestRank, HammerfestRank } from "./hammerfest-rank.js";
import { $HammerfestScore, HammerfestScore } from "./hammerfest-score.js";
import { $ShortHammerfestUser, ShortHammerfestUser } from "./short-hammerfest-user.js";

export interface HammerfestProfile {
  user: ShortHammerfestUser;
  email?: NullableEmailAddress;
  bestScore: HammerfestScore;
  bestLevel: HammerfestLevel;
  hasCarrot: boolean;
  seasonScore: HammerfestScore;
  rank: HammerfestRank;
  hallOfFame: NullableHammerfestHallOfFameMessage;
  items: HammerfestItemId[];
  quests: HammerfestQuestStatusMap;
}

export const $HammerfestProfile: RecordIoType<HammerfestProfile> = new RecordType<HammerfestProfile>({
  properties: {
    user: {type: $ShortHammerfestUser},
    email: {type: $NullableEmailAddress, optional: true},
    bestScore: {type: $HammerfestScore},
    bestLevel: {type: $HammerfestLevel},
    hasCarrot: {type: $Boolean},
    seasonScore: {type: $HammerfestScore},
    rank: {type: $HammerfestRank},
    hallOfFame: {type: $NullableHammerfestHallOfFameMessage},
    items: {type: new ArrayType({itemType: $HammerfestItemId, maxLength: 1000})},
    quests: {type: $HammerfestQuestStatusMap},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableHammerfestProfile = null | HammerfestProfile;

export const $NullableHammerfestProfile: TryUnionType<NullableHammerfestProfile> = new TryUnionType({variants: [$Null, $HammerfestProfile]});
