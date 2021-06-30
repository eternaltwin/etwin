package net.eternaltwin.dinoparc

import JSON_FORMAT
import kotlinx.serialization.*

/**
 * Shortest unambiguous identifier for a Dinoparc user.
 */
@Serializable
data class ShortDinoparcUser constructor(
  val server: DinoparcServer,
  val id: DinoparcUserId,
  val username: DinoparcUsername,
) {
  companion object {
    @JvmStatic
    fun fromJsonString(jsonString: String): ShortDinoparcUser = JSON_FORMAT.decodeFromString(jsonString)

    @JvmStatic
    fun toJsonString(value: ShortDinoparcUser): String = JSON_FORMAT.encodeToString(value)
  }
}
