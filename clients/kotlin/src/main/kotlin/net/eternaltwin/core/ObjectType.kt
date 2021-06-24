package net.eternaltwin.core

import kotlinx.serialization.Serializable

@Serializable
enum class ObjectType {
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
  UserForumActor;
}
