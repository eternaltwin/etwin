package net.eternaltwin.link

import kotlinx.serialization.*
import net.eternaltwin.hammerfest.ShortHammerfestUser

@Serializable
data class HammerfestLink constructor(
  val link: LinkAction,
  val unlink: LinkAction?,
  val user: ShortHammerfestUser,
)
