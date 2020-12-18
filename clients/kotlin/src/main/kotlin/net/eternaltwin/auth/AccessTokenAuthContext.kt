package net.eternaltwin.auth

import JSON_FORMAT
import kotlinx.serialization.*
import net.eternaltwin.oauth.ShortOauthClient
import net.eternaltwin.user.ShortUser

@Serializable
data class AccessTokenAuthContext constructor(
  val scope: AuthScope,
  val client: ShortOauthClient,
  val user: ShortUser,
) {
  companion object {
    @JvmStatic
    fun fromJsonString(jsonString: String): AccessTokenAuthContext = JSON_FORMAT.decodeFromString(jsonString)

    @JvmStatic
    fun toJsonString(value: AccessTokenAuthContext): String = JSON_FORMAT.encodeToString(value)
  }
}
