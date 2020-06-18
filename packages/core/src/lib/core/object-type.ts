import { TsEnumType } from "kryo/lib/ts-enum.js";

/**
 * Tag identifying the object types.
 *
 * It helps with discriminated unions and reflection.
 */
export enum ObjectType {
  HammerfestUser,
  TwinoidUser,
  OauthClient,
  User,
  ForumSection,
  ForumThread,
  ForumPost,
  ForumPostRevision,
  ForumRole,
}

export const $ObjectType: TsEnumType<ObjectType> = new TsEnumType<ObjectType>({
  enum: ObjectType,
});
