import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array.js";
import { $Boolean } from "kryo/lib/boolean.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

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
import { $HammerfestUserRef, HammerfestUserRef } from "./hammerfest-user-ref.js";

export interface HammerfestProfile {
  user: HammerfestUserRef;
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
    user: {type: $HammerfestUserRef},
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
