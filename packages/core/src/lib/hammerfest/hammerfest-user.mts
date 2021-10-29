import { CaseStyle } from "kryo";
import { $Date } from "kryo/date";
import { LiteralType } from "kryo/literal";
import { $Null } from "kryo/null";
import { RecordIoType, RecordType } from "kryo/record";
import { TryUnionType } from "kryo/try-union";

import { $ObjectType, ObjectType } from "../core/object-type.mjs";
import { $VersionedEtwinLink, VersionedEtwinLink } from "../link/versioned-etwin-link.mjs";
import { $HammerfestServer, HammerfestServer } from "./hammerfest-server.mjs";
import { $HammerfestUserId, HammerfestUserId } from "./hammerfest-user-id.mjs";
import { $HammerfestUsername, HammerfestUsername } from "./hammerfest-username.mjs";
import { $NullableStoredHammerfestItems, NullableStoredHammerfestItems } from "./stored-hammerfest-items.mjs";
import { $NullableStoredHammerfestProfile, NullableStoredHammerfestProfile } from "./stored-hammerfest-profile.mjs";

/**
 * A full Hammerfest user
 */
export interface HammerfestUser {
  type: ObjectType.HammerfestUser;
  server: HammerfestServer;
  id: HammerfestUserId;
  username: HammerfestUsername;
  archivedAt: Date;
  profile: NullableStoredHammerfestProfile;
  items: NullableStoredHammerfestItems;
  etwin: VersionedEtwinLink;
}

export const $HammerfestUser: RecordIoType<HammerfestUser> = new RecordType<HammerfestUser>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.HammerfestUser})},
    server: {type: $HammerfestServer},
    id: {type: $HammerfestUserId},
    username: {type: $HammerfestUsername},
    archivedAt: {type: $Date},
    profile: {type: $NullableStoredHammerfestProfile},
    items: {type: $NullableStoredHammerfestItems},
    etwin: {type: $VersionedEtwinLink},
  },
  changeCase: CaseStyle.SnakeCase,
});

export type NullableHammerfestUser = null | HammerfestUser;

export const $NullableHammerfestUser: TryUnionType<NullableHammerfestUser> = new TryUnionType({variants: [$Null, $HammerfestUser]});
