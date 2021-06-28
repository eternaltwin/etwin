import { TsEnumType } from "kryo/lib/ts-enum";

/**
 * Tag identifying the object types.
 *
 * It helps with discriminated unions and reflection.
 */
export enum ObjectType {
  Announcement,
  ClientForumActor,
  DinoparcDinoz,
  DinoparcUser,
  ForumPost,
  ForumPostRevision,
  ForumSection,
  ForumThread,
  HammerfestUser,
  OauthClient,
  RoleForumActor,
  TwinoidUser,
  User,
  UserForumActor,
}

export const $ObjectType: TsEnumType<ObjectType> = new TsEnumType<ObjectType>({
  enum: ObjectType,
});
