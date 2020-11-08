package net.eternaltwin.user

import InstantSerializer
import JSON_FORMAT
import kotlinx.serialization.*
import net.eternaltwin.email.EmailAddress
import net.eternaltwin.link.VersionedLinks
import java.time.Instant

/**
 * User reference with extra data to display it.
 */
@Serializable
data class CompleteUser constructor(
  val id: UserId,
  @SerialName("display_name")
  val displayName: UserDisplayNameVersions,
  @SerialName("is_administrator")
  val isAdministrator: Boolean,
  val links: VersionedLinks,
  @Serializable(with = InstantSerializer::class)
  val ctime: Instant,
  val username: VersionedLinks?,
  @SerialName("email_address")
  val emailAddress: EmailAddress?,
  @SerialName("has_password")
  val hasPassword: Boolean,
) {
  companion object {
    fun fromJsonString(jsonString: String): CompleteUser = JSON_FORMAT.decodeFromString(jsonString)

    fun toJsonString(value: CompleteUser): String = JSON_FORMAT.encodeToString(value)
  }
}
