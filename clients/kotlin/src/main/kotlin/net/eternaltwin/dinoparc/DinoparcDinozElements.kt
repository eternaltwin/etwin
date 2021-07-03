package net.eternaltwin.dinoparc

import JSON_FORMAT
import kotlinx.serialization.*

/**
 * Dinoparc Dinoz elements (stats).
 */
@Serializable
data class DinoparcDinozElements constructor(
  val fire: Int, // TODO: UShort
  val earth: Int, // TODO: UShort
  val water: Int, // TODO: UShort
  val thunder: Int, // TODO: UShort
  val air: Int, // TODO: UShort
) {
  companion object {
    @JvmStatic
    fun fromJsonString(jsonString: String): DinoparcDinozElements = JSON_FORMAT.decodeFromString(jsonString)

    @JvmStatic
    fun toJsonString(value: DinoparcDinozElements): String = JSON_FORMAT.encodeToString(value)
  }
}
