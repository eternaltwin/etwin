package net.eternaltwin.user;

import net.eternaltwin.SerializationTestItem
import net.eternaltwin.hammerfest.*
import net.eternaltwin.link.*
import net.eternaltwin.twinoid.ShortTwinoidUser
import net.eternaltwin.twinoid.TwinoidUserDisplayName
import net.eternaltwin.twinoid.TwinoidUserId
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import java.time.Instant
import java.util.stream.Stream
import kotlin.test.assertEquals

class MaybeCompleteUserTest {
  companion object {
    @JvmStatic
    fun fromJsonString(): Stream<SerializationTestItem<MaybeCompleteUser>> =
      SerializationTestItem.streamFromTestDir(
        "core/user/maybe-complete-user",
        mapOf(
          "complete-demurgos" to MaybeCompleteUser.Complete(
            CompleteUser(
              id = UserId("9f310484-963b-446b-af69-797feec6813f"),
              displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("Demurgos"))),
              isAdministrator = true,
              links = VersionedLinks(
                dinoparcCom = VersionedDinoparcLink(
                  current = null,
                  old = listOf()
                ),
                enDinoparcCom = VersionedDinoparcLink(
                  current = null,
                  old = listOf()
                ),
                hammerfestEs = VersionedHammerfestLink(
                  current = null,
                  old = listOf()
                ),
                hammerfestFr = VersionedHammerfestLink(
                  current = HammerfestLink(
                    link = LinkAction(
                      time = Instant.parse("2017-05-25T23:12:50.000Z"),
                      user = ShortUser(
                        id = UserId("9f310484-963b-446b-af69-797feec6813f"),
                        displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("Demurgos"))),
                      )
                    ),
                    unlink = null,
                    user = ShortHammerfestUser(
                      server = HammerfestServer.HammerfestFr,
                      id = HammerfestUserId("127"),
                      username = HammerfestUsername("elseabora")
                    )
                  ),
                  old = listOf()
                ),
                hfestNet = VersionedHammerfestLink(
                  current = HammerfestLink(
                    link = LinkAction(
                      time = Instant.parse("2017-05-25T23:13:12.000Z"),
                      user = ShortUser(
                        id = UserId("9f310484-963b-446b-af69-797feec6813f"),
                        displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("Demurgos"))),
                      )
                    ),
                    unlink = null,
                    user = ShortHammerfestUser(
                      server = HammerfestServer.HfestNet,
                      id = HammerfestUserId("205769"),
                      username = HammerfestUsername("Demurgos")
                    )
                  ),
                  old = listOf()
                ),
                spDinoparcCom = VersionedDinoparcLink(
                  current = null,
                  old = listOf()
                ),
                twinoid = VersionedTwinoidLink(
                  current = TwinoidLink(
                    link = LinkAction(
                      time = Instant.parse("2020-10-26T18:53:14.493Z"),
                      user = ShortUser(
                        id = UserId("9f310484-963b-446b-af69-797feec6813f"),
                        displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("Demurgos"))),
                      )
                    ),
                    unlink = null,
                    user = ShortTwinoidUser(
                      id = TwinoidUserId("38"),
                      displayName = TwinoidUserDisplayName("Demurgos")
                    )
                  ),
                  old = listOf()
                ),
              ),
              createdAt = Instant.parse("2017-05-25T23:12:50.000Z"),
              username = null,
              emailAddress = null,
              hasPassword = false,
            )
          ),
          "demurgos" to MaybeCompleteUser.Simple(
            User(
              id = UserId("9f310484-963b-446b-af69-797feec6813f"),
              displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("Demurgos"))),
              isAdministrator = true,
              links = VersionedLinks(
                dinoparcCom = VersionedDinoparcLink(
                  current = null,
                  old = listOf()
                ),
                enDinoparcCom = VersionedDinoparcLink(
                  current = null,
                  old = listOf()
                ),
                hammerfestEs = VersionedHammerfestLink(
                  current = null,
                  old = listOf()
                ),
                hammerfestFr = VersionedHammerfestLink(
                  current = HammerfestLink(
                    link = LinkAction(
                      time = Instant.parse("2017-05-25T23:12:50.000Z"),
                      user = ShortUser(
                        id = UserId("9f310484-963b-446b-af69-797feec6813f"),
                        displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("Demurgos"))),
                      )
                    ),
                    unlink = null,
                    user = ShortHammerfestUser(
                      server = HammerfestServer.HammerfestFr,
                      id = HammerfestUserId("127"),
                      username = HammerfestUsername("elseabora")
                    )
                  ),
                  old = listOf()
                ),
                hfestNet = VersionedHammerfestLink(
                  current = HammerfestLink(
                    link = LinkAction(
                      time = Instant.parse("2017-05-25T23:13:12.000Z"),
                      user = ShortUser(
                        id = UserId("9f310484-963b-446b-af69-797feec6813f"),
                        displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("Demurgos"))),
                      )
                    ),
                    unlink = null,
                    user = ShortHammerfestUser(
                      server = HammerfestServer.HfestNet,
                      id = HammerfestUserId("205769"),
                      username = HammerfestUsername("Demurgos")
                    )
                  ),
                  old = listOf()
                ),
                spDinoparcCom = VersionedDinoparcLink(
                  current = null,
                  old = listOf()
                ),
                twinoid = VersionedTwinoidLink(
                  current = TwinoidLink(
                    link = LinkAction(
                      time = Instant.parse("2020-10-26T18:53:14.493Z"),
                      user = ShortUser(
                        id = UserId("9f310484-963b-446b-af69-797feec6813f"),
                        displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("Demurgos"))),
                      )
                    ),
                    unlink = null,
                    user = ShortTwinoidUser(
                      id = TwinoidUserId("38"),
                      displayName = TwinoidUserDisplayName("Demurgos")
                    )
                  ),
                  old = listOf()
                ),
              ),
            )
          ),
        ),
      )
  }

  @ParameterizedTest
  @MethodSource
  fun fromJsonString(item: SerializationTestItem<MaybeCompleteUser>) {
    val actual: MaybeCompleteUser = MaybeCompleteUser.fromJsonString(item.jsonString)
    assertEquals(item.value, actual)
  }
}
