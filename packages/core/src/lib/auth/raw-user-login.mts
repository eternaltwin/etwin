import { Ucs2StringType } from "kryo/ucs2-string";

/**
 * An unchecked login string: it is not normalized and its variant is not resolved (username or email address).
 *
 * See `Login` for the resolved variant.
 */
export type RawUserLogin = string;

export const $RawUserLogin: Ucs2StringType = new Ucs2StringType({maxLength: 100});
