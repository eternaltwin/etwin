import { LocaleId } from "../core/locale-id.js";
import { AnnouncementTitle } from "./announcement-title.js";
import { MarkdownText } from "../core/markdown-text.js";

export interface CreateAnnouncementOptions {
  locale: LocaleId;
  title: AnnouncementTitle;
  body: MarkdownText;
}
