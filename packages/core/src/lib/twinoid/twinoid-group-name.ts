import { $Ucs2String, Ucs2StringType } from "kryo/lib/ucs2-string";

/**
 * A Twinoid group name
 *
 * This corresponds to the type of `Group.name` in the Twinoid API.
 */
export type TwinoidGroupName = string;

export const $TwinoidGroupName: Ucs2StringType = $Ucs2String;
