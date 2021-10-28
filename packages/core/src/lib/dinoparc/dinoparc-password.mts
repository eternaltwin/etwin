import { $Ucs2String, Ucs2StringType } from "kryo/ucs2-string";

/**
 * Represents a clear Dinoparc password.
 */
export type DinoparcPassword = string;

export const $DinoparcPassword: Ucs2StringType = $Ucs2String;
