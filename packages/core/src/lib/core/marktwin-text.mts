import { $Null } from "kryo/null";
import { TryUnionType } from "kryo/try-union";
import { $Ucs2String } from "kryo/ucs2-string";

/**
 * Raw marktwin content.
 */
export type MarktwinText = string;

export const $MarktwinText = $Ucs2String;

export type NullableMarktwinText = null | MarktwinText;

export const $NullableMarktwinText: TryUnionType<NullableMarktwinText> = new TryUnionType({variants: [$Null, $MarktwinText]});
