import { $Ucs2String } from "kryo/lib/ucs2-string.js";
import { WhiteListType } from "kryo/lib/white-list.js";

/**
 * An ISO locale ID.
 *
 * A locale id corresponds to a language code followed by an optional region code.
 *
 * Pattern: `^[a-z]{2,3}(?:-[A-Z]{1,3})$`
 * Examples: `fr`, `en-US`, `en-GB, `es`
 */
export type LocaleId = "de-DE" | "en-US" | "eo" | "es-SP" | "fr-FR";

export const $LocaleId: WhiteListType<LocaleId> = new WhiteListType({
  itemType: $Ucs2String,
  values: ["de-DE", "en-US", "eo", "es-SP", "fr-FR"],
});
