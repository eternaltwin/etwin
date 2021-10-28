import { CaseStyle } from "kryo";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $RawUserDot, RawUserDot } from "../core/raw-user-dot.mjs";
import { $HammerfestUserIdRef, HammerfestUserIdRef } from "../hammerfest/hammerfest-user-id-ref.mjs";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.mjs";

export interface RawHammerfestLink {
  link: RawUserDot;
  unlink: null;
  etwin: UserIdRef;
  remote: HammerfestUserIdRef;
}

export const $RawHammerfestLink: RecordIoType<RawHammerfestLink> = new RecordType<RawHammerfestLink>({
  properties: {
    link: {type: $RawUserDot},
    unlink: {type: $Null},
    etwin: {type: $UserIdRef},
    remote: {type: $HammerfestUserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableRawHammerfestLink = null | RawHammerfestLink;

export const $NullableRawHammerfestLink: TryUnionType<NullableRawHammerfestLink> = new TryUnionType({variants: [$Null, $RawHammerfestLink]});
