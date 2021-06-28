import { BytesType } from "kryo/lib/bytes";
import { $Null } from "kryo/lib/null";
import { TryUnionType } from "kryo/lib/try-union";

/**
 * Represents a clear password as sent by the user.
 */
export type Password = Uint8Array;

export const $Password: BytesType = new BytesType({maxLength: 256});

export type NullablePassword = null | Password;

export const $NullablePassword: TryUnionType<NullablePassword> = new TryUnionType({variants: [$Null, $Password]});
