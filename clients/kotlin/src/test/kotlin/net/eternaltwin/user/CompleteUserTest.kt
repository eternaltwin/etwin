package net.eternaltwin.user;

import net.eternaltwin.SerializationTestItem
import net.eternaltwin.dinoparc.DinoparcServer
import net.eternaltwin.dinoparc.DinoparcUserId
import net.eternaltwin.dinoparc.DinoparcUsername
import net.eternaltwin.dinoparc.ShortDinoparcUser
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

class CompleteUserTest {
  companion object {
    @JvmStatic
    fun fromJsonString(): Stream<SerializationTestItem<CompleteUser>> =
      SerializationTestItem.streamFromTestDir(
        "core/user/complete-user",
        mapOf(
          "demurgos" to CompleteUser(
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
          ),
          "djtoph" to CompleteUser(
            id = UserId("8ec810f9-47f6-4f17-8aa1-0335cb4fb0fd"),
            displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("DJtoph"))),
            isAdministrator = false,
            links = VersionedLinks(
              dinoparcCom = VersionedDinoparcLink(
                current = DinoparcLink(
                  link = LinkAction(
                    time = Instant.parse("2021-06-25T15:15:49.069Z"),
                    user = ShortUser(
                      id = UserId("8ec810f9-47f6-4f17-8aa1-0335cb4fb0fd"),
                      displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("DJtoph"))),
                    )
                  ),
                  unlink = null,
                  user = ShortDinoparcUser(
                    server = DinoparcServer.DinoparcCom,
                    id = DinoparcUserId("205944"),
                    username = DinoparcUsername("djtoph")
                  )
                ),
                old = listOf()
              ),
              enDinoparcCom = VersionedDinoparcLink(
                current = DinoparcLink(
                  link = LinkAction(
                    time = Instant.parse("2021-06-25T15:14:01.782Z"),
                    user = ShortUser(
                      id = UserId("8ec810f9-47f6-4f17-8aa1-0335cb4fb0fd"),
                      displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("DJtoph"))),
                    )
                  ),
                  unlink = null,
                  user = ShortDinoparcUser(
                    server = DinoparcServer.EnDinoparcCom,
                    id = DinoparcUserId("58144"),
                    username = DinoparcUsername("josum41")
                  )
                ),
                old = listOf()
              ),
              hammerfestEs = VersionedHammerfestLink(
                current = null,
                old = listOf()
              ),
              hammerfestFr = VersionedHammerfestLink(
                current = null,
                old = listOf()
              ),
              hfestNet = VersionedHammerfestLink(
                current = null,
                old = listOf()
              ),
              spDinoparcCom = VersionedDinoparcLink(
                current = null,
                old = listOf()
              ),
              twinoid = VersionedTwinoidLink(
                current = TwinoidLink(
                  link = LinkAction(
                    time = Instant.parse("2021-04-23T15:45:11.517Z"),
                    user = ShortUser(
                      id = UserId("8ec810f9-47f6-4f17-8aa1-0335cb4fb0fd"),
                      displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("DJtoph"))),
                    )
                  ),
                  unlink = null,
                  user = ShortTwinoidUser(
                    id = TwinoidUserId("1225351"),
                    displayName = TwinoidUserDisplayName("Jowpacabra")
                  )
                ),
                old = listOf()
              ),
            ),
            createdAt = Instant.parse("2020-06-23T23:34:57.000Z"),
            username = Username("jonathan"),
            emailAddress = null,
            hasPassword = true,
          ),
        ),
      )
  }

  @ParameterizedTest
  @MethodSource
  fun fromJsonString(item: SerializationTestItem<CompleteUser>) {
    val actual: CompleteUser = CompleteUser.fromJsonString(item.jsonString)
    assertEquals(item.value, actual)
  }
}
