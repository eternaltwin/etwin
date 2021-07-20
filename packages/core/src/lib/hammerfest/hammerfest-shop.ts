import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/boolean";
import { $Uint32 } from "kryo/integer";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

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
