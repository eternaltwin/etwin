import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean.js";
import { $Uint32 } from "kryo/lib/integer.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

export interface HammerfestShop {
  tokens: number;
  weeklyTokens: number;
  purchasedTokens: number | null;
  hasQuestBonus: boolean;
}

export const $HammerfestShop: RecordIoType<HammerfestShop> = new RecordType<HammerfestShop>({
  properties: {
    tokens: {type: $Uint32},
    weeklyTokens: {type: $Uint32},
    purchasedTokens: {type: new TryUnionType({variants: [$Null, $Uint32]})},
    hasQuestBonus: {type: $Boolean},
  },
  changeCase: CaseStyle.SnakeCase,
});
