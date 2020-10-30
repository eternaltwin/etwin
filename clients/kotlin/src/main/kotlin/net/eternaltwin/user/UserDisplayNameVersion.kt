package net.eternaltwin.user

import kotlinx.serialization.Serializable

@Serializable
data class UserDisplayNameVersion(
    val value: UserDisplayName,
//    val startTime: Date,
)
