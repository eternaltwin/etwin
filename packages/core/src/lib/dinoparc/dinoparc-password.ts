import { $Ucs2String, Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * Represents a clear Dinoparc password.
 */
export type DinoparcPassword = string;

export const $DinoparcPassword: Ucs2StringType = $Ucs2String;
