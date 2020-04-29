import { Ucs2StringType } from "kryo/lib/ucs2-string.js";

/**
 * The user display name: the name of the user as it should be displayed on interfaces.
 * It may be non-unique.
 */
export type UserDisplayName = string;

let pattern: RegExp;
try {
  pattern = new RegExp("^[\\p{Letter}_ ()]+$", "u");
} catch {
  pattern = /^[\s\S]+$/;
}

export const $UserDisplayName: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 3,
  maxLength: 64,
  pattern,
});
