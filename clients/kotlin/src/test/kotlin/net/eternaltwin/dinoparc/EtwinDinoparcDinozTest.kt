package net.eternaltwin.dinoparc;

import net.eternaltwin.SerializationTestItem
import net.eternaltwin.core.LatestTemporal
import net.eternaltwin.core.PeriodLower
import net.eternaltwin.core.Snapshot
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
              Snapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:46.935Z")),
                DinoparcDinozName("Black Devil")
              )
            ),
            race = LatestTemporal(
              Snapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                DinoparcDinozRace.Kump
              )
            ),
            skin = LatestTemporal(
              Snapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                DinoparcDinozSkin("CBUfOj64r0ZaVmk#")
              )
            ),
            life = LatestTemporal(Snapshot(PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")), 0U)),
            level = LatestTemporal(Snapshot(PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")), 288U)),
            experience = LatestTemporal(Snapshot(PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")), 2U)),
            danger = LatestTemporal(Snapshot(PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")), -231)),
            inTournament = LatestTemporal(Snapshot(PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")), false)),
            elements = LatestTemporal(
              Snapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                DinoparcDinozElements(23U, 79U, 111U, 67U, 16U)
              )
            ),
            skills = LatestTemporal(
              Snapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                HashMap(
                  mapOf(
                    DinoparcSkill.Bargain to 5U,
                    DinoparcSkill.Camouflage to 2U,
                    DinoparcSkill.Climb to 5U,
                    DinoparcSkill.Cook to 5U,
                    DinoparcSkill.Counterattack to 1U,
                    DinoparcSkill.Dexterity to 1U,
                    DinoparcSkill.Dig to 5U,
                    DinoparcSkill.EarthApprentice to 5U,
                    DinoparcSkill.FireApprentice to 5U,
                    DinoparcSkill.Intelligence to 5U,
                    DinoparcSkill.Jump to 5U,
                    DinoparcSkill.Luck to 4U,
                    DinoparcSkill.MartialArts to 5U,
                    DinoparcSkill.Medicine to 5U,
                    DinoparcSkill.Music to 5U,
                    DinoparcSkill.Navigation to 5U,
                    DinoparcSkill.Perception to 5U,
                    DinoparcSkill.Provoke to 5U,
                    DinoparcSkill.Run to 5U,
                    DinoparcSkill.ShadowPower to 5U,
                    DinoparcSkill.Stamina to 5U,
                    DinoparcSkill.Steal to 5U,
                    DinoparcSkill.Strategy to 1U,
                    DinoparcSkill.Strength to 4U,
                    DinoparcSkill.Survival to 4U,
                    DinoparcSkill.Swim to 5U,
                    DinoparcSkill.ThunderApprentice to 5U,
                    DinoparcSkill.TotemThief to 1U,
                    DinoparcSkill.WaterApprentice to 5U,
                  )
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
