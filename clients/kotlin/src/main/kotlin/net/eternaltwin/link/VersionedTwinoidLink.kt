package net.eternaltwin.link

import kotlinx.serialization.*

@Serializable
data class VersionedTwinoidLink constructor(
  val current: TwinoidLink?,
  val old: List<TwinoidLink>,
)
