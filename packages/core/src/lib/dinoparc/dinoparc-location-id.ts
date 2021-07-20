import { $Null } from "kryo/null";
import { TryUnionType } from "kryo/try-union";
import { Ucs2StringType } from "kryo/ucs2-string";

/**
 * A Dinoparc location id.
 */
export type DinoparcLocationId = string;

export const $DinoparcLocationId: Ucs2StringType = new Ucs2StringType({
  minLength: 1,
  maxLength: 4,
  trimmed: true,
  pattern: /^0|[1-9]\d{0,3}$/,
});

export type NullableDinoparcLocationId = null | DinoparcLocationId;

export const $NullableDinoparcLocationId: TryUnionType<NullableDinoparcLocationId> = new TryUnionType({variants: [$Null, $DinoparcLocationId]});
