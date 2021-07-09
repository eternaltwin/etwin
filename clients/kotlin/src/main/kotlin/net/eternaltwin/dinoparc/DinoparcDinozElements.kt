package net.eternaltwin.dinoparc

import JSON_FORMAT
import kotlinx.serialization.*

/**
 * Dinoparc Dinoz elements (stats).
 */
@Serializable
data class DinoparcDinozElements constructor(
  val fire: DinoparcDinozElementLevel,
  val earth: DinoparcDinozElementLevel,
  val water: DinoparcDinozElementLevel,
  val thunder: DinoparcDinozElementLevel,
  val air: DinoparcDinozElementLevel,
) {
  companion object {
    @JvmStatic
    fun fromJsonString(jsonString: String): DinoparcDinozElements = JSON_FORMAT.decodeFromString(jsonString)

    @JvmStatic
    fun toJsonString(value: DinoparcDinozElements): String = JSON_FORMAT.encodeToString(value)
  }
}
