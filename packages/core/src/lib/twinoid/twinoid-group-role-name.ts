import { $Ucs2String, Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * A Twinoid group role name
 *
 * This corresponds to the type of `GroupMember.role.name` in the Twinoid API.
 */
export type TwinoidGroupRoleName = string;

export const $TwinoidGroupRoleName: Ucs2StringType = $Ucs2String;
