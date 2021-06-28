import { $Ucs2String, Ucs2StringType } from "kryo/lib/ucs2-string";

/**
 * A Twinoid user display name
 *
 * This corresponds to the type of `User.name` in the Twinoid API.
 */
export type TwinoidUserDisplayName = string;

export const $TwinoidUserDisplayName: Ucs2StringType = $Ucs2String;
