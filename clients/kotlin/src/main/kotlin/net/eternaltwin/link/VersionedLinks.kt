package net.eternaltwin.link

import kotlinx.serialization.*

@Serializable
data class VersionedLinks constructor(
  @SerialName("dinoparc_com")
  val dinoparcCom: VersionedDinoparcLink,
  @SerialName("en_dinoparc_com")
  val enDinoparcCom: VersionedDinoparcLink,
  @SerialName("hammerfest_es")
  val hammerfestEs: VersionedHammerfestLink,
  @SerialName("hammerfest_fr")
  val hammerfestFr: VersionedHammerfestLink,
  @SerialName("hfest_net")
  val hfestNet: VersionedHammerfestLink,
  @SerialName("sp_dinoparc_com")
  val spDinoparcCom: VersionedDinoparcLink,
  val twinoid: VersionedTwinoidLink,
)
