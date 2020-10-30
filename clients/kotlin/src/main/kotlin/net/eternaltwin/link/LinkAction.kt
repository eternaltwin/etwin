package net.eternaltwin.link

import InstantSerializer
import kotlinx.serialization.Serializable
import net.eternaltwin.user.ShortUser
import java.time.Instant

@Serializable
data class LinkAction constructor(
  @Serializable(with = InstantSerializer::class)
  val time: Instant,
  val user: ShortUser,
)
