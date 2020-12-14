package net.eternaltwin.oauth

interface ShortOauthClientLike {
  val id: OauthClientId
  val key: OauthClientKey?
  val displayName: OauthClientDisplayName
}
