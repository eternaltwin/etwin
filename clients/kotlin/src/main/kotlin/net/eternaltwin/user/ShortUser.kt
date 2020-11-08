package net.eternaltwin.user

import JSON_FORMAT
import kotlinx.serialization.*

/**
 * User reference with extra data to display it.
 */
@Serializable
data class ShortUser constructor(
  val id: UserId,
  @SerialName("display_name")
  val displayName: UserDisplayNameVersions,
) {
  companion object {
    fun fromJsonString(jsonString: String): ShortUser = JSON_FORMAT.decodeFromString(jsonString)

    fun toJsonString(value: ShortUser): String = JSON_FORMAT.encodeToString(value)
  }
}
