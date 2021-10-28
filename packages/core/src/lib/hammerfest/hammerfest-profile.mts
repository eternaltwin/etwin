import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/array";
import { $Boolean } from "kryo/boolean";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $NullableEmailAddress, NullableEmailAddress } from "../email/email-address.mjs";
import {
  $NullableHammerfestHallOfFameMessage,
  NullableHammerfestHallOfFameMessage
} from "./hammerfest-hall-of-fame-message.mjs";
import { $HammerfestItemId, HammerfestItemId } from "./hammerfest-item-id.mjs";
import { $HammerfestLadderLevel, HammerfestLadderLevel } from "./hammerfest-ladder-level.mjs";
import { $HammerfestLevel, HammerfestLevel } from "./hammerfest-level.mjs";
import { $HammerfestQuestStatusMap, HammerfestQuestStatusMap } from "./hammerfest-quest-status-map.mjs";
import { $HammerfestScore, HammerfestScore } from "./hammerfest-score.mjs";
import { $ShortHammerfestUser, ShortHammerfestUser } from "./short-hammerfest-user.mjs";

export interface HammerfestProfile {
  user: ShortHammerfestUser;
  email?: NullableEmailAddress;
  bestScore: HammerfestScore;
  bestLevel: HammerfestLevel;
  hasCarrot: boolean;
  seasonScore: HammerfestScore;
  ladderLevel: HammerfestLadderLevel;
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
    ladderLevel: {type: $HammerfestLadderLevel},
    hallOfFame: {type: $NullableHammerfestHallOfFameMessage},
    items: {type: new ArrayType({itemType: $HammerfestItemId, maxLength: 1000})},
    quests: {type: $HammerfestQuestStatusMap},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableHammerfestProfile = null | HammerfestProfile;

export const $NullableHammerfestProfile: TryUnionType<NullableHammerfestProfile> = new TryUnionType({variants: [$Null, $HammerfestProfile]});
