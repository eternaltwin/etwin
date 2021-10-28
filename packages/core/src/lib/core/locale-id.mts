import { $Null } from "kryo/null";
import { TryUnionType } from "kryo/try-union";
import { $Ucs2String } from "kryo/ucs2-string";
import { WhiteListType } from "kryo/white-list";

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

export type NullableLocaleId = null | LocaleId;

export const $NullableLocaleId: TryUnionType<NullableLocaleId> = new TryUnionType({variants: [$Null, $LocaleId]});
