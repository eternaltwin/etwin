package net.eternaltwin.user

import JSON_FORMAT
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import net.eternaltwin.link.VersionedLinks

@Serializable
data class User constructor(
  override val id: UserId,
  @SerialName("display_name")
  override val displayName: UserDisplayNameVersions,
  @SerialName("is_administrator")
  override val isAdministrator: Boolean,
  override val links: VersionedLinks,
) : UserLike {
  companion object {
    @JvmStatic
    fun fromJsonString(jsonString: String): User = JSON_FORMAT.decodeFromString(jsonString)

    @JvmStatic
    fun toJsonString(value: User): String = JSON_FORMAT.encodeToString(value)
  }
}
