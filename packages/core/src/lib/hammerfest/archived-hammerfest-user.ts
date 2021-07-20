import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { LiteralType } from "kryo/literal";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.js";
import { $HammerfestUserId, HammerfestUserId } from "./hammerfest-user-id.js";
import { $HammerfestUsername, HammerfestUsername } from "./hammerfest-username.js";

/**
 * Am Hammerfest user retrieved from the store.
 */
export interface ArchivedHammerfestUser {
  type: ObjectType.HammerfestUser;
  server: HammerfestServer;
  id: HammerfestUserId;
  username: HammerfestUsername;
  archivedAt: Date;
}

export const $ArchivedHammerfestUser: RecordIoType<ArchivedHammerfestUser> = new RecordType<ArchivedHammerfestUser>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.HammerfestUser})},
    server: {type: $HammerfestServer},
    id: {type: $HammerfestUserId},
    username: {type: $HammerfestUsername},
    archivedAt: {type: $Date},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableArchivedHammerfestUser = null | ArchivedHammerfestUser;

export const $NullableArchivedHammerfestUser: TryUnionType<NullableArchivedHammerfestUser> = new TryUnionType({variants: [$Null, $ArchivedHammerfestUser]});
