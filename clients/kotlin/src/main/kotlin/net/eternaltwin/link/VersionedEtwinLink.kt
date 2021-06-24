package net.eternaltwin.link

import kotlinx.serialization.*

@Serializable
data class VersionedEtwinLink constructor(
  val current: EtwinLink?,
  val old: List<EtwinLink>,
)
