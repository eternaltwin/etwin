package net.eternaltwin.user

import InstantSerializer
import JSON_FORMAT
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import net.eternaltwin.email.EmailAddress
import net.eternaltwin.link.VersionedLinks
import java.time.Instant

/**
 * User reference with extra data to display it.
 */
@Serializable
data class CompleteUser constructor(
  override val id: UserId,
  @SerialName("display_name")
  override val displayName: UserDisplayNameVersions,
  @SerialName("is_administrator")
  override val isAdministrator: Boolean,
  override val links: VersionedLinks,
  @Serializable(with = InstantSerializer::class)
  @SerialName("created_at")
  val createdAt: Instant,
  val username: Username?,
  @SerialName("email_address")
  val emailAddress: EmailAddress?,
  @SerialName("has_password")
  val hasPassword: Boolean,
) : UserLike {
  companion object {
    @JvmStatic
    fun fromJsonString(jsonString: String): CompleteUser = JSON_FORMAT.decodeFromString(jsonString)

    @JvmStatic
    fun toJsonString(value: CompleteUser): String = JSON_FORMAT.encodeToString(value)
  }
}
