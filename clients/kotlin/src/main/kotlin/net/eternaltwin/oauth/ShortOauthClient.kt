package net.eternaltwin.oauth

import JSON_FORMAT
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString

@Serializable
data class ShortOauthClient constructor(
  override val id: OauthClientId,
  override val key: OauthClientKey? = null,
  @SerialName("display_name")
  override val displayName: OauthClientDisplayName,
) : ShortOauthClientLike {
  companion object {
    @JvmStatic
    fun fromJsonString(jsonString: String): ShortOauthClient = JSON_FORMAT.decodeFromString(jsonString)

    @JvmStatic
    fun toJsonString(value: ShortOauthClient): String = JSON_FORMAT.encodeToString(value)
  }
}
