package net.eternaltwin.auth

import JSON_FORMAT
import kotlinx.serialization.*
import net.eternaltwin.user.ShortUser

@Serializable
data class UserAuthContext constructor(
  val scope: AuthScope,
  val user: ShortUser,
  @SerialName("is_administrator")
  val isAdministrator: Boolean,
) {
  companion object {
    fun fromJsonString(jsonString: String): UserAuthContext = JSON_FORMAT.decodeFromString(jsonString)

    fun toJsonString(value: UserAuthContext): String = JSON_FORMAT.encodeToString(value)
  }
}
