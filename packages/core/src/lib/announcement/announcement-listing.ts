import { CaseStyle } from "kryo";
import { ArrayType } from "kryo/lib/array";
import { $Uint32 } from "kryo/lib/integer";
import { RecordIoType, RecordType } from "kryo/lib/record";

import { $ShortAnnouncement, ShortAnnouncement } from "./short-announcement.js";

export interface AnnouncementListing {
  offset: number;
  limit: number;
  count: number;
  items: ShortAnnouncement[];
}

export const $AnnouncementListing: RecordIoType<AnnouncementListing> = new RecordType<AnnouncementListing>({
  properties: {
    offset: {type: $Uint32},
    limit: {type: $Uint32},
    count: {type: $Uint32},
    items: {type: new ArrayType({itemType: $ShortAnnouncement, maxLength: 100})},
  },
  changeCase: CaseStyle.SnakeCase,
});
