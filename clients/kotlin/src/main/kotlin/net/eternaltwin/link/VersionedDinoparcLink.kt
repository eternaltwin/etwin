package net.eternaltwin.link

import kotlinx.serialization.*

@Serializable
data class VersionedDinoparcLink constructor(
  val current: DinoparcLink?,
  val old: List<DinoparcLink>,
)
