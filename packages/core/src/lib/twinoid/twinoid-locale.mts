import { $Null } from "kryo/null";
import { TryUnionType } from "kryo/try-union";
import { $Ucs2String } from "kryo/ucs2-string";
import { WhiteListType } from "kryo/white-list";

export type TwinoidLocale = "en" | "es" | "fr";

export const $TwinoidLocale: WhiteListType<TwinoidLocale> = new WhiteListType({
  itemType: $Ucs2String,
  values: ["en", "es", "fr"],
});

export type NullableTwinoidLocale = null | TwinoidLocale;

export const $NullableTwinoidLocale: TryUnionType<NullableTwinoidLocale> = new TryUnionType({variants: [$Null, $TwinoidLocale]});
