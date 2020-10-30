package net.eternaltwin.user

import kotlinx.serialization.Serializable

@Serializable
data class UserDisplayNameVersions(
    val current: UserDisplayNameVersion,
    val latest: UserDisplayNameVersion? = null,
)
