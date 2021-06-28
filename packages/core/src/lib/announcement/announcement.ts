import { CaseStyle } from "kryo";
import { $Date } from "kryo/lib/date";
import { LiteralType } from "kryo/lib/literal";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $LocaleId, LocaleId } from "../core/locale-id.js";
import { $ObjectType, ObjectType } from "../core/object-type.js";
import { $ForumThread, ForumThread } from "../forum/forum-thread.js";
import { $AnnouncementId, AnnouncementId } from "./announcement-id.js";

export interface Announcement {
  type: ObjectType.Announcement;
  id: AnnouncementId;
  createdAt: Date;
  thread: ForumThread;
  locale: LocaleId;
}

export const $Announcement: RecordIoType<Announcement> = new RecordType<Announcement>({
  properties: {
    type: {type: new LiteralType({type: $ObjectType, value: ObjectType.Announcement})},
    id: {type: $AnnouncementId},
    thread: {type: $ForumThread},
    createdAt: {type: $Date},
    locale: {type: $LocaleId}
  },
  changeCase: CaseStyle.SnakeCase,
});
