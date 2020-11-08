package net.eternaltwin.user

import JSON_FORMAT
import kotlinx.serialization.*
import net.eternaltwin.link.VersionedLinks

@Serializable
data class User constructor(
  val id: UserId,
  @SerialName("display_name")
  val displayName: UserDisplayNameVersions,
  @SerialName("is_administrator")
  val isAdministrator: Boolean,
  val links: VersionedLinks,
) {
  companion object {
    fun fromJsonString(jsonString: String): User = JSON_FORMAT.decodeFromString(jsonString)

    fun toJsonString(value: User): String = JSON_FORMAT.encodeToString(value)
  }
}
