package net.eternaltwin.link

import kotlinx.serialization.*
import net.eternaltwin.twinoid.ShortTwinoidUser

@Serializable
data class TwinoidLink constructor(
  val link: LinkAction,
  val unlink: LinkAction?,
  val user: ShortTwinoidUser,
)
