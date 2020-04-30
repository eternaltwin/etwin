import { LocaleId } from "../core/locale-id.js";
import { UuidHex } from "../core/uuid-hex.js";
import { AnnouncementRevision } from "./announcement-revision.js";

export interface Announcement {
  id: UuidHex;
  revision: AnnouncementRevision;
  createdAt: Date;
  locales: Map<LocaleId, AnnouncementRevision>;
}
