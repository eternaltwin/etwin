package net.eternaltwin.core

import JSON_FORMAT
import kotlinx.serialization.*

/**
 * Represents the latest known snapshot for some remote data.
 */
@Serializable
data class LatestTemporal<T> constructor(
  val latest: ForeignSnapshot<T>,
) {
  companion object {
    inline fun <reified T> fromJsonString(jsonString: String): LatestTemporal<T> =
      JSON_FORMAT.decodeFromString(jsonString)

    fun <T> toJsonString(value: LatestTemporal<T>): String = JSON_FORMAT.encodeToString(value)
  }
}
