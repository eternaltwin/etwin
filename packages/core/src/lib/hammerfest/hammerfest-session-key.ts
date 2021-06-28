import { Ucs2StringType } from "kryo/lib/ucs2-string";

/**
 * A Hammerfest session key.
 *
 * It correspond to the value of the `SID` cookie.
 *
 * - `mh72ka0ohk2sa8s7ggaqb3pka7`
 * - `r4dfp17jdf1ntgsd5vuqbrcrs6`
 */
export type HammerfestSessionKey = string;

export const $HammerfestSessionKey: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 26,
  maxLength: 26,
  pattern: /^[0-9a-z]{26}$/,
});
