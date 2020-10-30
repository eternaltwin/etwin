package net.eternaltwin.link

import kotlinx.serialization.*

@Serializable
data class VersionedHammerfestLink constructor(
  val current: HammerfestLink?,
  val old: List<HammerfestLink>,
)
