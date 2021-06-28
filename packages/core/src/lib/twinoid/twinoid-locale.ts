import { $Null } from "kryo/lib/null";
import { TryUnionType } from "kryo/lib/try-union";
import { $Ucs2String } from "kryo/lib/ucs2-string";
import { WhiteListType } from "kryo/lib/white-list";

export type TwinoidLocale = "en" | "es" | "fr";

export const $TwinoidLocale: WhiteListType<TwinoidLocale> = new WhiteListType({
  itemType: $Ucs2String,
  values: ["en", "es", "fr"],
});

export type NullableTwinoidLocale = null | TwinoidLocale;

export const $NullableTwinoidLocale: TryUnionType<NullableTwinoidLocale> = new TryUnionType({variants: [$Null, $TwinoidLocale]});
