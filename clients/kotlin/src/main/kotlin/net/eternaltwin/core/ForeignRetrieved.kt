package net.eternaltwin.core

import InstantSerializer
import JSON_FORMAT
import kotlinx.serialization.*
import java.time.Instant

/**
 * Foreign data retrieval time metadata
 */
@Serializable
data class ForeignRetrieved constructor(
  @Serializable(with = InstantSerializer::class)
  val latest: Instant,
) {
  companion object {
    fun fromJsonString(jsonString: String): ForeignRetrieved = JSON_FORMAT.decodeFromString(jsonString)

    fun toJsonString(value: ForeignRetrieved): String = JSON_FORMAT.encodeToString(value)
  }
}
