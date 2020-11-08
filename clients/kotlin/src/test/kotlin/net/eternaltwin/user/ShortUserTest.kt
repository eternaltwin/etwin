package net.eternaltwin.user;

import net.eternaltwin.SerializationTestItem
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import java.util.stream.Stream
import kotlin.test.assertEquals

class ShortUserTest {
  companion object {
    @JvmStatic
    fun fromJsonString(): Stream<SerializationTestItem<ShortUser>> =
      SerializationTestItem.streamFromTestDir(
        "user/short-user",
        mapOf(
          "demurgos" to ShortUser(
            id = UserId("9f310484-963b-446b-af69-797feec6813f"),
            displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("Demurgos"))),
          ),
        ),
      )
  }

  @ParameterizedTest
  @MethodSource
  fun fromJsonString(item: SerializationTestItem<ShortUser>) {
    val actual: ShortUser = ShortUser.fromJsonString(item.jsonString)
    assertEquals(item.value, actual)
  }
}
