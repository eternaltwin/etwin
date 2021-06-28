import { Ucs2StringType } from "kryo/lib/ucs2-string";

/**
 * A Dinoparc session key.
 *
 * It correspond to the value of the `sid` cookie.
 *
 * - `oetxjSBD3FEqDlLLNffGUY0NLKMmDDjv`
 * - `pJ5zOeaKuw0mjGB9xdGVJuRdpCASjmBl`
 * - `LlkSCMQW5fESPSOUVt3FMrqBwXwAhwzj`
 */
export type DinoparcSessionKey = string;

export const $DinoparcSessionKey: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 32,
  maxLength: 32,
  pattern: /^[0-9a-zA-Z]{32}$/,
});
