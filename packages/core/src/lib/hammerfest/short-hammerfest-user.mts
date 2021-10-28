import { CaseStyle } from "kryo";
import { LiteralType } from "kryo/literal";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.mjs";
import { $HammerfestUserId, HammerfestUserId } from "./hammerfest-user-id.mjs";
import { $HammerfestUsername, HammerfestUsername } from "./hammerfest-username.mjs";

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
