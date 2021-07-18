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
                DinoparcDinozLife(0U)
              )
            ),
            level = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:49.651Z")),
                DinoparcDinozLevel(288U)
              )
            ),
            experience = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:49.651Z")),
                DinoparcDinozExperience(2U)
              )
            ),
            danger = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:49.651Z")),
                DinoparcDinozDanger(-231)
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
                DinoparcDinozElements(
                  DinoparcDinozElementLevel(23U),
                  DinoparcDinozElementLevel(79U),
                  DinoparcDinozElementLevel(111U),
                  DinoparcDinozElementLevel(67U),
                  DinoparcDinozElementLevel(16U)
                )
              )
            ),
            skills = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-06-23T13:54:47.670Z")),
                ForeignRetrieved(Instant.parse("2021-06-25T15:15:49.651Z")),
                mapOf(
                  DinoparcSkill.Bargain to DinoparcSkillLevel(5U),
                  DinoparcSkill.Camouflage to DinoparcSkillLevel(2U),
                  DinoparcSkill.Climb to DinoparcSkillLevel(5U),
                  DinoparcSkill.Cook to DinoparcSkillLevel(5U),
                  DinoparcSkill.Counterattack to DinoparcSkillLevel(1U),
                  DinoparcSkill.Dexterity to DinoparcSkillLevel(1U),
                  DinoparcSkill.Dig to DinoparcSkillLevel(5U),
                  DinoparcSkill.EarthApprentice to DinoparcSkillLevel(5U),
                  DinoparcSkill.FireApprentice to DinoparcSkillLevel(5U),
                  DinoparcSkill.Intelligence to DinoparcSkillLevel(5U),
                  DinoparcSkill.Jump to DinoparcSkillLevel(5U),
                  DinoparcSkill.Luck to DinoparcSkillLevel(4U),
                  DinoparcSkill.MartialArts to DinoparcSkillLevel(5U),
                  DinoparcSkill.Medicine to DinoparcSkillLevel(5U),
                  DinoparcSkill.Music to DinoparcSkillLevel(5U),
                  DinoparcSkill.Navigation to DinoparcSkillLevel(5U),
                  DinoparcSkill.Perception to DinoparcSkillLevel(5U),
                  DinoparcSkill.Provoke to DinoparcSkillLevel(5U),
                  DinoparcSkill.Run to DinoparcSkillLevel(5U),
                  DinoparcSkill.ShadowPower to DinoparcSkillLevel(5U),
                  DinoparcSkill.Stamina to DinoparcSkillLevel(5U),
                  DinoparcSkill.Steal to DinoparcSkillLevel(5U),
                  DinoparcSkill.Strategy to DinoparcSkillLevel(1U),
                  DinoparcSkill.Strength to DinoparcSkillLevel(4U),
                  DinoparcSkill.Survival to DinoparcSkillLevel(4U),
                  DinoparcSkill.Swim to DinoparcSkillLevel(5U),
                  DinoparcSkill.ThunderApprentice to DinoparcSkillLevel(5U),
                  DinoparcSkill.TotemThief to DinoparcSkillLevel(1U),
                  DinoparcSkill.WaterApprentice to DinoparcSkillLevel(5U),
                )
              )
            ),
          ),
          "unnamed" to EtwinDinoparcDinoz(
            server = DinoparcServer.DinoparcCom,
            id = DinoparcDinozId("3561648"),
            archivedAt = Instant.parse("2021-01-01T00:00:00.000Z"),
            name = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                null,
              )
            ),
            owner = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                ShortDinoparcUser(
                  server = DinoparcServer.DinoparcCom,
                  id = DinoparcUserId("205944"),
                  username = DinoparcUsername("djtoph"),
                )
              )
            ),
            location = null,
            race = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                DinoparcDinozRace.Cargou
              )
            ),
            skin = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                DinoparcDinozSkin("6eLfXvvKAabR6TNY")
              )
            ),
            life = null,
            level = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                DinoparcDinozLevel(1U)
              )
            ),
            experience = null,
            danger = null,
            inTournament = null,
            elements = null,
            skills = null,
          ),
          "yasumi" to EtwinDinoparcDinoz(
            server = DinoparcServer.EnDinoparcCom,
            id = DinoparcDinozId("765483"),
            archivedAt = Instant.parse("2021-01-01T00:00:00.000Z"),
            name = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                DinoparcDinozName("Yasumi")
              )
            ),
            owner = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                ShortDinoparcUser(
                  server = DinoparcServer.EnDinoparcCom,
                  id = DinoparcUserId("681579"),
                  username = DinoparcUsername("Kapox"),
                )
              )
            ),
            location = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                DinoparcLocationId("0")
              )
            ),
            race = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                DinoparcDinozRace.Wanwan
              )
            ),
            skin = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                DinoparcDinozSkin("Ac9OrgxOWu1pd7Fp")
              )
            ),
            life = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                DinoparcDinozLife(30U)
              )
            ),
            level = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                DinoparcDinozLevel(12U)
              )
            ),
            experience = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                DinoparcDinozExperience(13U)
              )
            ),
            danger = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                DinoparcDinozDanger(116)
              )
            ),
            inTournament = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                false
              )
            ),
            elements = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                DinoparcDinozElements(
                  DinoparcDinozElementLevel(10U),
                  DinoparcDinozElementLevel(0U),
                  DinoparcDinozElementLevel(0U),
                  DinoparcDinozElementLevel(7U),
                  DinoparcDinozElementLevel(2U)
                )
              )
            ),
            skills = LatestTemporal(
              ForeignSnapshot(
                PeriodLower(Instant.parse("2021-01-01T00:00:00.000Z")),
                ForeignRetrieved(Instant.parse("2021-01-01T00:00:00.000Z")),
                mapOf(
                  DinoparcSkill.Dexterity to DinoparcSkillLevel(2U),
                  DinoparcSkill.Intelligence to DinoparcSkillLevel(5U),
                  DinoparcSkill.MartialArts to DinoparcSkillLevel(5U),
                  DinoparcSkill.Strength to DinoparcSkillLevel(5U),
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
