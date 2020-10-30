package net.eternaltwin.link

import kotlinx.serialization.*

@Serializable
data class VersionedLinks constructor(
  @SerialName("hammerfest_es")
  val hammerfestEs: VersionedHammerfestLink,
  @SerialName("hammerfest_fr")
  val hammerfestFr: VersionedHammerfestLink,
  @SerialName("hfest_net")
  val hfestNet: VersionedHammerfestLink,
  val twinoid: VersionedTwinoidLink,
)
