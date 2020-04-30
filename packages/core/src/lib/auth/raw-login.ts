import { Ucs2StringType } from "kryo/lib/ucs2-string";

/**
 * An unchecked login string: it is not normalized and its variant is not resolved (username or email address).
 *
 * See `Login` for the resolved variant.
 */
export type RawLogin = string;

export const $RawLogin: Ucs2StringType = new Ucs2StringType({maxLength: 100});
