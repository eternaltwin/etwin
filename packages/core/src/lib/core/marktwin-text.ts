import { $Null } from "kryo/lib/null.js";
import { TryUnionType } from "kryo/lib/try-union.js";
import { $Ucs2String } from "kryo/lib/ucs2-string.js";

/**
 * Raw marktwin content.
 */
export type MarktwinText = string;

export const $MarktwinText = $Ucs2String;

export type NullableMarktwinText = null | MarktwinText;

export const $NullableMarktwinText: TryUnionType<NullableMarktwinText> = new TryUnionType({variants: [$Null, $MarktwinText]});
