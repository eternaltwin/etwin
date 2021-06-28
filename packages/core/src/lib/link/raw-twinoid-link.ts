import { CaseStyle } from "kryo";
import { $Null } from "kryo/lib/null";
import { RecordIoType, RecordType } from "kryo/lib/record";
import { TryUnionType } from "kryo/lib/try-union";

import { $RawUserDot, RawUserDot } from "../core/raw-user-dot.js";
import { $TwinoidUserIdRef, TwinoidUserIdRef } from "../twinoid/twinoid-user-id-ref.js";
import { $UserIdRef, UserIdRef } from "../user/user-id-ref.js";

export interface RawTwinoidLink {
  link: RawUserDot;
  unlink: null;
  etwin: UserIdRef;
  remote: TwinoidUserIdRef;
}

export const $RawTwinoidLink: RecordIoType<RawTwinoidLink> = new RecordType<RawTwinoidLink>({
  properties: {
    link: {type: $RawUserDot},
    unlink: {type: $Null},
    etwin: {type: $UserIdRef},
    remote: {type: $TwinoidUserIdRef},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableRawTwinoidLink = null | RawTwinoidLink;

export const $NullableRawTwinoidLink: TryUnionType<NullableRawTwinoidLink> = new TryUnionType({variants: [$Null, $RawTwinoidLink]});
