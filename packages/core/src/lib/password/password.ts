import { BytesType } from "kryo/lib/bytes.js";
import { $Null } from "kryo/lib/null.js";
import { TryUnionType } from "kryo/lib/try-union.js";

/**
 * Represents a clear password as sent by the user.
 */
export type Password = Uint8Array;

export const $Password: BytesType = new BytesType({maxLength: 256});

export type NullablePassword = null | Password;

export const $NullablePassword: TryUnionType<NullablePassword> = new TryUnionType({variants: [$Null, $Password]});
