import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/lib/literal.js";
import { $Null } from "kryo/lib/null.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";
import { TryUnionType } from "kryo/lib/try-union.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.js";
import { $HammerfestUserId, HammerfestUserId } from "./hammerfest-user-id.js";
import { $HammerfestUsername, HammerfestUsername } from "./hammerfest-username.js";

/**
 * A Hammerfest reference with a username.
 */
export interface ShortHammerfestUser {
  type: ObjectType.HammerfestUser;
  server: HammerfestServer;
  id: HammerfestUserId;
  username: HammerfestUsername;
}

export const $ShortHammerfestUser: RecordIoType<ShortHammerfestUser> = new RecordType<ShortHammerfestUser>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.HammerfestUser})},
    server: {type: $HammerfestServer},
    id: {type: $HammerfestUserId},
    username: {type: $HammerfestUsername},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableShortHammerfestUser = null | ShortHammerfestUser;

export const $NullableShortHammerfestUser: TryUnionType<NullableShortHammerfestUser> = new TryUnionType({variants: [$Null, $ShortHammerfestUser]});
