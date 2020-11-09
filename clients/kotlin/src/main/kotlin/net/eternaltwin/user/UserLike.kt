package net.eternaltwin.user

import net.eternaltwin.link.VersionedLinks

interface UserLike : ShortUserLike {
  val isAdministrator: Boolean
  val links: VersionedLinks
}
