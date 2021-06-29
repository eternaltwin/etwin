package net.eternaltwin.dinoparc

import JSON_FORMAT
import kotlinx.serialization.*

@Serializable
data class GetDinoparcDinozOptions constructor(
  val server: DinoparcServer,
  val id: DinoparcDinozId,
) {
  companion object {
    fun fromJsonString(jsonString: String): GetDinoparcDinozOptions = JSON_FORMAT.decodeFromString(jsonString)

    fun toJsonString(value: GetDinoparcDinozOptions): String = JSON_FORMAT.encodeToString(value)
  }
}
