package net.eternaltwin.hammerfest

import kotlinx.serialization.*

/**
 * User reference with extra data to display it.
 */
@Serializable
data class ShortHammerfestUser constructor(
    val server: HammerfestServer,
    val id: HammerfestUserId,
    val username: HammerfestUsername,
)
