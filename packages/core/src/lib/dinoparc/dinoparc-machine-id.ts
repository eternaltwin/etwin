import { Ucs2StringType } from "kryo/ucs2-string";

/**
 * A Dinoparc machine id.
 *
 * Dinoparc uses machine ids (mid, or just m) to track user machines.
 * The mid is stored in a flash shared object and updated created or retrieved at login time as a random 32-char string
 * of 0-9, a-z, A-Z chars.
 */
export type DinoparcMachineId = string;

export const $DinoparcMachineId: Ucs2StringType = new Ucs2StringType({
  minLength: 32,
  maxLength: 32,
  trimmed: true,
  pattern: /^[0-9a-zA-Z]{32}$/,
});
