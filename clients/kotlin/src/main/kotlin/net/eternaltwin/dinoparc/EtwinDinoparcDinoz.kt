package net.eternaltwin.dinoparc

import InstantSerializer
import JSON_FORMAT
import kotlinx.serialization.*
import net.eternaltwin.core.LatestTemporal
import java.time.Instant

/**
 * Archived Dinoparc dinoz.
 */
@Serializable
data class EtwinDinoparcDinoz constructor(
  val server: DinoparcServer,
  val id: DinoparcDinozId,
  @Serializable(with = InstantSerializer::class)
  @SerialName("archived_at")
  val archivedAt: Instant,
  val name: LatestTemporal<DinoparcDinozName>? = null,
  val owner: LatestTemporal<ShortDinoparcUser>? = null,
  val location: LatestTemporal<DinoparcLocationId>? = null,
  val race: LatestTemporal<DinoparcDinozRace>? = null,
  val skin: LatestTemporal<DinoparcDinozSkin>? = null,
  val life: LatestTemporal<Short>? = null, // TODO: UByte
  val level: LatestTemporal<Int>? = null, // TODO: UShort
  val experience: LatestTemporal<Short>? = null, // TODO: UByte
  val danger: LatestTemporal<Short>? = null,
  @SerialName("in_tournament")
  val inTournament: LatestTemporal<Boolean>? = null,
  val elements: LatestTemporal<DinoparcDinozElements>? = null,
  val skills: LatestTemporal<Map<DinoparcSkill, Byte>>? = null, // TODO: UByte
) {
  companion object {
    @JvmStatic
    fun fromJsonString(jsonString: String): EtwinDinoparcDinoz = JSON_FORMAT.decodeFromString(jsonString)

    @JvmStatic
    fun toJsonString(value: EtwinDinoparcDinoz): String = JSON_FORMAT.encodeToString(value)
  }
}
