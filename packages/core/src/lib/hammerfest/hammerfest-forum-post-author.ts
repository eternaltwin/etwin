import { CaseStyle } from "kryo";
import { $Boolean } from "kryo/boolean";
import { LiteralType } from "kryo/literal";
import { RecordIoType, RecordType } from "kryo/record";

import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $HammerfestForumRole, HammerfestForumRole } from "./hammerfest-forum-role.js";
import { $HammerfestLadderLevel, HammerfestLadderLevel } from "./hammerfest-ladder-level.js";
import { $HammerfestServer } from "./hammerfest-server.js";
import { $HammerfestUserId } from "./hammerfest-user-id.js";
import { $HammerfestUsername } from "./hammerfest-username.js";
import { ShortHammerfestUser } from "./short-hammerfest-user";

/**
 * A reference uniquely identifying a Hammerfest user.
 */
export interface HammerfestForumPostAuthor extends ShortHammerfestUser {
  hasCarrot: boolean;
  ladderLevel: HammerfestLadderLevel;
  role: HammerfestForumRole;
}

export const $HammerfestForumPostAuthor: RecordIoType<HammerfestForumPostAuthor> = new RecordType<HammerfestForumPostAuthor>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.HammerfestUser})},
    server: {type: $HammerfestServer},
    id: {type: $HammerfestUserId},
    username: {type: $HammerfestUsername},
    hasCarrot: {type: $Boolean},
    ladderLevel: {type: $HammerfestLadderLevel},
    role: {type: $HammerfestForumRole},
  },
  changeCase: CaseStyle.SnakeCase,
});
