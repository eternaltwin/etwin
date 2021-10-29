import { RecordIoType, RecordType } from "kryo/record";

import { $ForumThreadId, ForumThreadId } from "../forum/forum-thread-id.mjs";


export interface CreateAnnouncementOptions {
  thread: ForumThreadId;
}

export const $CreateAnnouncementOptions: RecordIoType<CreateAnnouncementOptions> = new RecordType<CreateAnnouncementOptions>({
  properties: {
    thread: {type: $ForumThreadId},
  }
});
