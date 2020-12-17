import { RecordIoType, RecordType } from "kryo/lib/record.js";

import { $ForumThreadId, ForumThreadId } from "../forum/forum-thread-id.js";


export interface CreateAnnouncementOptions {
  thread: ForumThreadId;
}

export const $CreateAnnouncementOptions: RecordIoType<CreateAnnouncementOptions> = new RecordType<CreateAnnouncementOptions>({
  properties: {
    thread: {type: $ForumThreadId},
  }
});
