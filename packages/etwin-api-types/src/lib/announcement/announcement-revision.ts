import { LocaleId } from "../core/locale-id.js";
import { RenderedText } from "../core/rendered-text.js";
import { UuidHex } from "../core/uuid-hex.js";
import { AnnouncementTitle } from "./announcement-title.js";

export interface AnnouncementRevision {
  id: UuidHex;
  date: Date;
  locale: LocaleId;
  title: AnnouncementTitle;
  body: RenderedText;
}
