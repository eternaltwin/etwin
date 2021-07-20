import { Ucs2StringType } from "kryo/ucs2-string";

/**
 * The user display name: the name of the user as it should be displayed on interfaces.
 * It may be non-unique.
 */
export type UserDisplayName = string;

let pattern: RegExp;
try {
  pattern = new RegExp("^[\\p{Letter}_ ()][\\p{Letter}_ ()0-9]*$", "u");
} catch {
  pattern = /^[\s\S]+$/;
}

export const $UserDisplayName: Ucs2StringType = new Ucs2StringType({
  trimmed: true,
  minLength: 2,
  maxLength: 64,
  pattern,
});
