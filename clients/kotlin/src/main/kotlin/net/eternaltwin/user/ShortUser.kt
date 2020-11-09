package net.eternaltwin.user

import JSON_FORMAT
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString

/**
 * User reference with extra data to display it.
 */
@Serializable
data class ShortUser constructor(
  override val id: UserId,
  @SerialName("display_name")
  override val displayName: UserDisplayNameVersions,
) : ShortUserLike {
  companion object {
    fun fromJsonString(jsonString: String): ShortUser = JSON_FORMAT.decodeFromString(jsonString)

    fun toJsonString(value: ShortUser): String = JSON_FORMAT.encodeToString(value)
  }
}
