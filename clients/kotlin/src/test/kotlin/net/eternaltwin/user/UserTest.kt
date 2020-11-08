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

class UserTest {
  companion object {
    @JvmStatic
    fun fromJsonString(): Stream<SerializationTestItem<User>> =
      SerializationTestItem.streamFromTestDir(
        "user/user",
        mapOf(
          "demurgos" to User(
            id = UserId("9f310484-963b-446b-af69-797feec6813f"),
            displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("Demurgos"))),
            isAdministrator = true,
            links = VersionedLinks(
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
          ),
        ),
      )
  }

  @ParameterizedTest
  @MethodSource
  fun fromJsonString(item: SerializationTestItem<User>) {
    val actual: User = User.fromJsonString(item.jsonString)
    assertEquals(item.value, actual)
  }
}
