import { BytesType } from "kryo/bytes";
import { $Null } from "kryo/null";
import { TryUnionType } from "kryo/try-union";

/**
 * Password hash output.
 */
export type PasswordHash = Uint8Array;

export const $PasswordHash: BytesType = new BytesType({maxLength: 256});

export type NullablePasswordHash = null | PasswordHash;

export const $NullablePasswordHash: TryUnionType<NullablePasswordHash> = new TryUnionType({variants: [$Null, $PasswordHash]});
