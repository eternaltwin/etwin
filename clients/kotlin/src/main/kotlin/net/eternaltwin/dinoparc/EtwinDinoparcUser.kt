package net.eternaltwin.dinoparc

import InstantSerializer
import JSON_FORMAT
import kotlinx.serialization.*
import net.eternaltwin.core.LatestTemporal
import net.eternaltwin.link.VersionedEtwinLink
import java.time.Instant

/**
 * Archived Dinoparc user.
 */
@Serializable
data class EtwinDinoparcUser constructor(
  val server: DinoparcServer,
  val id: DinoparcDinozId,
  @Serializable(with = InstantSerializer::class)
  @SerialName("archived_at")
  val archivedAt: Instant,
  val username: DinoparcUsername,
  val coins: LatestTemporal<UInt>? = null,
  val dinoz: LatestTemporal<List<DinoparcDinozIdRef>>? = null,
  val inventory: LatestTemporal<Map<DinoparcItemId, UInt>>? = null,
  val collection: LatestTemporal<DinoparcCollection>? = null,
  val etwin: VersionedEtwinLink,
) {
  companion object {
    fun fromJsonString(jsonString: String): EtwinDinoparcUser = JSON_FORMAT.decodeFromString(jsonString)

    fun toJsonString(value: EtwinDinoparcUser): String = JSON_FORMAT.encodeToString(value)
  }
}
