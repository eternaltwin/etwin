import { BytesType } from "kryo/lib/bytes.js";

/**
 * Represents a clear password as sent by the user.
 */
export type Password = Uint8Array;

export const $Password: BytesType = new BytesType({maxLength: 256});
