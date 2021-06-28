import { $Null } from "kryo/lib/null";
import { TryUnionType } from "kryo/lib/try-union";
import { Ucs2StringType } from "kryo/lib/ucs2-string";

/**
 * Any email address.
 *
 * It may be non-verified.
 */
export type EmailAddress = string;

/**
 * We only check that the adress is trimmed and non-empty, but leave-out verification.
 * (We only check for the `@` symbol).
 */
export const $EmailAddress: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 1,
  maxLength: 100,
  pattern: /@/,
});

export type NullableEmailAddress = null | EmailAddress;

export const $NullableEmailAddress: TryUnionType<NullableEmailAddress> = new TryUnionType({variants: [$Null, $EmailAddress]});
