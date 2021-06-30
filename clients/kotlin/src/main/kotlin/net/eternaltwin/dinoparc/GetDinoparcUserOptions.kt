package net.eternaltwin.dinoparc

import JSON_FORMAT
import kotlinx.serialization.*

@Serializable
data class GetDinoparcUserOptions constructor(
  val server: DinoparcServer,
  val id: DinoparcUserId,
) {
  companion object {
    @JvmStatic
    fun fromJsonString(jsonString: String): GetDinoparcUserOptions = JSON_FORMAT.decodeFromString(jsonString)

    @JvmStatic
    fun toJsonString(value: GetDinoparcUserOptions): String = JSON_FORMAT.encodeToString(value)
  }
}
