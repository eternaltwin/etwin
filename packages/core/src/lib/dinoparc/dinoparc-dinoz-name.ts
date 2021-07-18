import { $Null } from "kryo/lib/null";
import { TryUnionType } from "kryo/lib/try-union";
import { Ucs2StringType } from "kryo/lib/ucs2-string";

/**
 * A Dinoparc dinoz name
 */
export type DinoparcDinozName = string;

export const $DinoparcDinozName: Ucs2StringType = new Ucs2StringType({
  trimmed: false,
  minLength: 1,
  maxLength: 50,
  pattern: /^.{1,50}$/,
});

export type NullableDinoparcDinozName = null | DinoparcDinozName;

export const $NullableDinoparcDinozName: TryUnionType<NullableDinoparcDinozName> = new TryUnionType({variants: [$Null, $DinoparcDinozName]});
