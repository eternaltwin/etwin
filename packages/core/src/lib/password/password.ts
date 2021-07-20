import { BytesType } from "kryo/bytes";
import { $Null } from "kryo/null";
import { TryUnionType } from "kryo/try-union";

/**
 * Represents a clear password as sent by the user.
 */
export type Password = Uint8Array;

export const $Password: BytesType = new BytesType({maxLength: 256});

export type NullablePassword = null | Password;

export const $NullablePassword: TryUnionType<NullablePassword> = new TryUnionType({variants: [$Null, $Password]});
