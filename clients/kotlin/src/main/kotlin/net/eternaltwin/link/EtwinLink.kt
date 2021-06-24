package net.eternaltwin.link

import kotlinx.serialization.*
import net.eternaltwin.hammerfest.ShortHammerfestUser
import net.eternaltwin.user.ShortUser

@Serializable
data class EtwinLink constructor(
  val link: LinkAction,
  val unlink: LinkAction?,
  val user: ShortUser,
)
