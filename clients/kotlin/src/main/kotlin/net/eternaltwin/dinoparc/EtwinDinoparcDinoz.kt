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
  val race: LatestTemporal<DinoparcDinozRace>? = null,
  val skin: LatestTemporal<DinoparcDinozSkin>? = null,
  val life: LatestTemporal<UByte>? = null,
  val level: LatestTemporal<UShort>? = null,
  val experience: LatestTemporal<UByte>? = null,
  val danger: LatestTemporal<Short>? = null,
  @SerialName("in_tournament")
  val inTournament: LatestTemporal<Boolean>? = null,
  val elements: LatestTemporal<DinoparcDinozElements>? = null,
  val skills: LatestTemporal<HashMap<DinoparcSkill, UByte>>? = null,
) {
  companion object {
    fun fromJsonString(jsonString: String): EtwinDinoparcDinoz = JSON_FORMAT.decodeFromString(jsonString)

    fun toJsonString(value: EtwinDinoparcDinoz): String = JSON_FORMAT.encodeToString(value)
  }
}
