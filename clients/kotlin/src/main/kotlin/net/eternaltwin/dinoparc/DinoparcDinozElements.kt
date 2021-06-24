package net.eternaltwin.dinoparc

import JSON_FORMAT
import kotlinx.serialization.*

/**
 * Dinoparc Dinoz elements (stats).
 */
@Serializable
data class DinoparcDinozElements constructor(
  val fire: UShort,
  val earth: UShort,
  val water: UShort,
  val thunder: UShort,
  val air: UShort,
) {
  companion object {
    fun fromJsonString(jsonString: String): DinoparcDinozElements = JSON_FORMAT.decodeFromString(jsonString)

    fun toJsonString(value: DinoparcDinozElements): String = JSON_FORMAT.encodeToString(value)
  }
}
