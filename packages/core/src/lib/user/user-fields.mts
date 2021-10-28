import { TaggedUnionType } from "kryo/tagged-union";

import { $CompleteIfSelfUserFields, CompleteIfSelfUserFields } from "./complete-if-self-user-fields.mjs";
import { $CompleteUserFields, CompleteUserFields } from "./complete-user-fields.mjs";
import { $DefaultUserFields, DefaultUserFields } from "./default-user-fields.mjs";
import { $ShortUserFields, ShortUserFields } from "./short-user-fields.mjs";

export type UserFields =
  CompleteIfSelfUserFields
  | CompleteUserFields
  | DefaultUserFields
  | ShortUserFields;

export const $UserFields: TaggedUnionType<UserFields> = new TaggedUnionType<UserFields>({
  variants: [$CompleteIfSelfUserFields, $CompleteUserFields, $DefaultUserFields, $ShortUserFields],
  tag: "type",
});
