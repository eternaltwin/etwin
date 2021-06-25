package net.eternaltwin.core

import JSON_FORMAT
import kotlinx.serialization.*

/**
 * Represents the state of a foreign value during a given period (with a finite lower bound)
 */
@Serializable
data class ForeignSnapshot<T> constructor(
  val period: PeriodLower,
  val retrieved: ForeignRetrieved,
  val value: T,
) {
  companion object {
    inline fun <reified T> fromJsonString(jsonString: String): ForeignSnapshot<T> =
      JSON_FORMAT.decodeFromString(jsonString)

    fun <T> toJsonString(value: ForeignSnapshot<T>): String = JSON_FORMAT.encodeToString(value)
  }
}
