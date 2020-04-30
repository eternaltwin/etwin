import { LocaleId } from "../core/locale-id.js";
import { MarkdownText } from "../core/markdown-text.js";
import { AnnouncementTitle } from "./announcement-title.js";

export interface CreateAnnouncementOptions {
  locale: LocaleId;
  title: AnnouncementTitle;
  body: MarkdownText;
}
