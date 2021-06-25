package net.eternaltwin.link

import kotlinx.serialization.*
import net.eternaltwin.dinoparc.ShortDinoparcUser
import net.eternaltwin.hammerfest.ShortHammerfestUser

@Serializable
data class DinoparcLink constructor(
  val link: LinkAction,
  val unlink: LinkAction?,
  val user: ShortDinoparcUser,
)
