import { LocaleId } from "../core/locale-id.js";
import { ForumSectionDisplayName } from "./forum-section-display-name.js";

export interface CreateOrUpdateSystemSectionOptions {
  displayName: ForumSectionDisplayName;
  locale: LocaleId | null;
}
