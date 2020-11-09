package net.eternaltwin.client

import net.eternaltwin.auth.AuthContext
import net.eternaltwin.user.MaybeCompleteUser
import net.eternaltwin.user.UserId

interface EtwinClient {
  fun getSelf(auth: Auth): AuthContext

  fun getUser(auth: Auth, userId: UserId): MaybeCompleteUser
}
