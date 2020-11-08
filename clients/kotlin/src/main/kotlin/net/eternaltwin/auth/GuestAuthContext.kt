package net.eternaltwin.auth

import JSON_FORMAT
import kotlinx.serialization.*
import net.eternaltwin.user.ShortUser

@Serializable
data class GuestAuthContext constructor(
  val scope: AuthScope,
) {
  companion object {
    fun fromJsonString(jsonString: String): GuestAuthContext = JSON_FORMAT.decodeFromString(jsonString)

    fun toJsonString(value: GuestAuthContext): String = JSON_FORMAT.encodeToString(value)
  }
}
