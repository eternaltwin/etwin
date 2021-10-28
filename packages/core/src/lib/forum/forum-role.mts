import { TsEnumType } from "kryo/ts-enum";

/**
 * Tag identifying the object types.
 *
 * It helps with discriminated unions and reflection.
 */
export enum ForumRole {
  Administrator,
  Moderator,
}

export const $ForumRole: TsEnumType<ForumRole> = new TsEnumType<ForumRole>({
  enum: ForumRole,
});
