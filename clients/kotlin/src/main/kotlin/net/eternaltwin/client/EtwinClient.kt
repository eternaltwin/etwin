package net.eternaltwin.client

import net.eternaltwin.user.ShortUser
import net.eternaltwin.user.UserId

interface EtwinClient {
    fun getUser(userId: UserId): ShortUser
}
