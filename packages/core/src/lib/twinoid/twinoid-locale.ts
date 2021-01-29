import { $Null } from "kryo/lib/null.js";
import { TryUnionType } from "kryo/lib/try-union.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";
import { WhiteListType } from "kryo/lib/white-list.js";

export type TwinoidLocale = "en" | "es" | "fr";

export const $TwinoidLocale: WhiteListType<TwinoidLocale> = new WhiteListType({
  itemType: $Ucs2String,
  values: ["en", "es", "fr"],
});

export type NullableTwinoidLocale = null | TwinoidLocale;

export const $NullableTwinoidLocale: TryUnionType<NullableTwinoidLocale> = new TryUnionType({variants: [$Null, $TwinoidLocale]});
