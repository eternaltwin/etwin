package net.eternaltwin.dinoparc

import JSON_FORMAT
import kotlinx.serialization.*

/**
 * Unique dinoz identifier.
 */
@Serializable
data class DinoparcDinozIdRef constructor(
  val server: DinoparcServer,
  val id: DinoparcDinozId,
) {
  companion object {
    @JvmStatic
    fun fromJsonString(jsonString: String): DinoparcDinozIdRef = JSON_FORMAT.decodeFromString(jsonString)

    @JvmStatic
    fun toJsonString(value: DinoparcDinozIdRef): String = JSON_FORMAT.encodeToString(value)
  }
}
