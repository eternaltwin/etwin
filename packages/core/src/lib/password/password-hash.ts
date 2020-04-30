import { BytesType } from "kryo/lib/bytes.js";

/**
 * Password hash output.
 */
export type PasswordHash = Uint8Array;

export const $PasswordHash: BytesType = new BytesType({maxLength: 256});
