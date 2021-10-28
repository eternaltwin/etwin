import { LocaleId } from "../core/locale-id.mjs";
import { ForumSectionDisplayName } from "./forum-section-display-name.mjs";

export interface CreateOrUpdateSystemSectionOptions {
  displayName: ForumSectionDisplayName;
  locale: LocaleId | null;
}
