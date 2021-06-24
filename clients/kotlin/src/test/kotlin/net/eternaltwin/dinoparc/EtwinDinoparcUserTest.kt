package net.eternaltwin.dinoparc;

import net.eternaltwin.SerializationTestItem
import net.eternaltwin.core.LatestTemporal
import net.eternaltwin.core.PeriodLower
import net.eternaltwin.core.Snapshot
import net.eternaltwin.link.EtwinLink
import net.eternaltwin.link.LinkAction
import net.eternaltwin.link.VersionedEtwinLink
import net.eternaltwin.user.*
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import java.time.Instant
import java.util.stream.Stream
import kotlin.test.assertEquals

class EtwinDinoparcUserTest {
  companion object {
    @JvmStatic
    fun fromJsonString(): Stream<SerializationTestItem<EtwinDinoparcUser>> =
      SerializationTestItem.streamFromTestDir(
        "core/dinoparc/etwin-dinoparc-user",
        mapOf(
          "demurgos" to EtwinDinoparcUser(
            server = DinoparcServer.DinoparcCom,
            id = DinoparcDinozId("2480723"),
            archivedAt = Instant.parse("2020-12-18T00:56:12.769Z"),
            username = DinoparcUsername("demurgos"),
            coins = null,
            dinoz = null,
            inventory = null,
            etwin = VersionedEtwinLink(
              current = EtwinLink(
                link = LinkAction(
                  time = Instant.parse("2020-12-18T00:56:12.769Z"),
                  user = ShortUser(
                    UserId("9f310484-963b-446b-af69-797feec6813f"),
                    UserDisplayNameVersions(
                      UserDisplayNameVersion(UserDisplayName("Demurgos"))
                    )
                  )
                ),
                unlink = null,
                user = ShortUser(
                  UserId("9f310484-963b-446b-af69-797feec6813f"),
                  UserDisplayNameVersions(
                    UserDisplayNameVersion(UserDisplayName("Demurgos"))
                  )
                )
              ),
              listOf(),
            ),
          ),
        ),
      )
  }

  @ParameterizedTest
  @MethodSource
  fun fromJsonString(item: SerializationTestItem<EtwinDinoparcUser>) {
    val actual: EtwinDinoparcUser = EtwinDinoparcUser.fromJsonString(item.jsonString)
    assertEquals(item.value, actual)
  }
}
