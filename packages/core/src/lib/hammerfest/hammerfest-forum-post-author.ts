import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/lib/boolean.js";
import { LiteralType } from "kryo/lib/literal.js";
import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $HammerfestForumRole, HammerfestForumRole } from "./hammerfest-forum-role.js";
import { $HammerfestRank, HammerfestRank } from "./hammerfest-rank.js";
import { $HammerfestServer } from "./hammerfest-server.js";
import { $HammerfestUserId } from "./hammerfest-user-id.js";
import { $HammerfestUsername } from "./hammerfest-username.js";
import { ShortHammerfestUser } from "./short-hammerfest-user";

/**
 * A reference uniquely identifying a Hammerfest user.
 */
export interface HammerfestForumPostAuthor extends ShortHammerfestUser {
  hasCarrot: boolean;
  rank: HammerfestRank;
  role: HammerfestForumRole;
}

export const $HammerfestForumPostAuthor: RecordIoType<HammerfestForumPostAuthor> = new RecordType<HammerfestForumPostAuthor>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.HammerfestUser})},
    server: {type: $HammerfestServer},
    id: {type: $HammerfestUserId},
    username: {type: $HammerfestUsername},
    hasCarrot: {type: $Boolean},
    rank: {type: $HammerfestRank},
    role: {type: $HammerfestForumRole},
  },
  changeCase: CaseStyle.SnakeCase,
});
