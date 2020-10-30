package net.eternaltwin.twinoid

import kotlinx.serialization.*

@Serializable
data class ShortTwinoidUser constructor(
  val id: TwinoidUserId,
  @SerialName("display_name")
  val displayName: TwinoidUserDisplayName,
)
