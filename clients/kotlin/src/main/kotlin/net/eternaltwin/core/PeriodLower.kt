package net.eternaltwin.core

import InstantSerializer
import JSON_FORMAT
import kotlinx.serialization.*
import java.time.Instant

/**
 * Time period with a finite lower bound
 */
@Serializable
data class PeriodLower constructor(
  @Serializable(with = InstantSerializer::class)
  val start: Instant,
  @Serializable(with = InstantSerializer::class)
  val end: Instant? = null,
) {
  companion object {
    fun fromJsonString(jsonString: String): PeriodLower = JSON_FORMAT.decodeFromString(jsonString)

    fun toJsonString(value: PeriodLower): String = JSON_FORMAT.encodeToString(value)
  }
}
