package net.eternaltwin.dinoparc;

import net.eternaltwin.SerializationTestItem
import net.eternaltwin.core.*
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import java.time.Instant
import java.util.stream.Stream
import kotlin.test.assertEquals

class EtwinDinoparcDinozTest {
  companion object {
    @JvmStatic
    fun fromJsonString(): Stream<SerializationTestItem<EtwinDinoparcDinoz>> =
      SerializationTestItem.streamFromTestDir(
        "core/dinoparc/etwin-dinoparc-dinoz",
        mapOf(
          "black-devil" to EtwinDinoparcDinoz(
            server = DinoparcServer.DinoparcCom,
            id = DinoparcDinozId("3453835"),
            archivedAt = Instant.parse("2021-06-23T13:54:46.935Z"),
            name = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:46.935Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:50.062Z")),
                DinoparcDinozName("Black Devil")
              )
            ),
            owner = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:46.935Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:50.062Z")),
                ShortDinoparcUser(
                  server = DinoparcServer.DinoparcCom,
                  id = DinoparcUserId("205944"),
                  username = DinoparcUsername("djtoph"),
                )
              )
            ),
            location = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:46.935Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:50.062Z")),
                DinoparcLocationId("0")
              )
            ),
            race = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:49.651Z")),
                DinoparcDinozRace.Kump
              )
            ),
            skin = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:49.651Z")),
                DinoparcDinozSkin("CBUfOj64r0ZaVmk#")
              )
            ),
            life = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:49.651Z")),
                0
              )
            ),
            level = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:49.651Z")),
                288
              )
            ),
            experience = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:49.651Z")),
                2
              )
            ),
            danger = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:49.651Z")),
                -231
              )
            ),
            inTournament = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:49.651Z")),
                false
              )
            ),
            elements = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:49.651Z")),
                DinoparcDinozElements(23, 79, 111, 67, 16)
              )
            ),
            skills = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:49.651Z")),
                mapOf(
                  DinoparcSkill.Bargain to 5,
                  DinoparcSkill.Camouflage to 2,
                  DinoparcSkill.Climb to 5,
                  DinoparcSkill.Cook to 5,
                  DinoparcSkill.Counterattack to 1,
                  DinoparcSkill.Dexterity to 1,
                  DinoparcSkill.Dig to 5,
                  DinoparcSkill.EarthApprentice to 5,
                  DinoparcSkill.FireApprentice to 5,
                  DinoparcSkill.Intelligence to 5,
                  DinoparcSkill.Jump to 5,
                  DinoparcSkill.Luck to 4,
                  DinoparcSkill.MartialArts to 5,
                  DinoparcSkill.Medicine to 5,
                  DinoparcSkill.Music to 5,
                  DinoparcSkill.Navigation to 5,
                  DinoparcSkill.Perception to 5,
                  DinoparcSkill.Provoke to 5,
                  DinoparcSkill.Run to 5,
                  DinoparcSkill.ShadowPower to 5,
                  DinoparcSkill.Stamina to 5,
                  DinoparcSkill.Steal to 5,
                  DinoparcSkill.Strategy to 1,
                  DinoparcSkill.Strength to 4,
                  DinoparcSkill.Survival to 4,
                  DinoparcSkill.Swim to 5,
                  DinoparcSkill.ThunderApprentice to 5,
                  DinoparcSkill.TotemThief to 1,
                  DinoparcSkill.WaterApprentice to 5,
                )
              )
            ),
          ),
        ),
      )
  }

  @ParameterizedTest
  @MethodSource
  fun fromJsonString(item: SerializationTestItem<EtwinDinoparcDinoz>) {
    val actual: EtwinDinoparcDinoz = EtwinDinoparcDinoz.fromJsonString(item.jsonString)
    assertEquals(item.value, actual)
  }
}
