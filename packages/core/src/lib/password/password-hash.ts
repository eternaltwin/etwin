import { BytesType } from "kryo/lib/bytes.js";
import { $Null } from "kryo/lib/null.js";
import { TryUnionType } from "kryo/lib/try-union.js";

/**
 * Password hash output.
 */
export type PasswordHash = Uint8Array;

export const $PasswordHash: BytesType = new BytesType({maxLength: 256});

export type NullablePasswordHash = null | PasswordHash;

export const $NullablePasswordHash: TryUnionType<NullablePasswordHash> = new TryUnionType({variants: [$Null, $PasswordHash]});
