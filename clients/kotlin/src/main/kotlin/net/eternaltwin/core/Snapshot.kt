package net.eternaltwin.core

import JSON_FORMAT
import kotlinx.serialization.*

/**
 * Represents the state of a value during a given period (with a finite lower bound)
 */
@Serializable
data class Snapshot<T> constructor(
  val period: PeriodLower,
  val value: T,
) {
  companion object {
    @JvmStatic
    inline fun <reified T> fromJsonString(jsonString: String): Snapshot<T> =
      JSON_FORMAT.decodeFromString(jsonString)

    @JvmStatic
    fun <T> toJsonString(value: Snapshot<T>): String = JSON_FORMAT.encodeToString(value)
  }
}
