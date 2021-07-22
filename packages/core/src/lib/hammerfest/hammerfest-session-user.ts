import { CaseStyle } from "kryo";
import { $Uint32 } from "kryo/integer";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $ShortHammerfestUser, ShortHammerfestUser } from "./short-hammerfest-user.js";

export interface HammerfestSessionUser {
  user: ShortHammerfestUser;
  tokens: number;
}

export const $HammerfestSessionUser: RecordIoType<HammerfestSessionUser> = new RecordType<HammerfestSessionUser>({
  properties: {
    user: {type: $ShortHammerfestUser},
    tokens: {type: $Uint32},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableHammerfestSessionUser = null | HammerfestSessionUser;

export const $NullableHammerfestSessionUser: TryUnionType<NullableHammerfestSessionUser> = new TryUnionType({variants: [$Null, $HammerfestSessionUser]});
