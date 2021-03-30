package net.eternaltwin.auth;

import net.eternaltwin.SerializationTestItem
import net.eternaltwin.user.*
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import java.util.stream.Stream
import kotlin.test.assertEquals

class UserAuthContextTest {
  companion object {
    @JvmStatic
    fun fromJsonString(): Stream<SerializationTestItem<UserAuthContext>> =
      SerializationTestItem.streamFromTestDir(
        "core/auth/user-auth-context",
        mapOf(
          "demurgos" to UserAuthContext(
            scope = AuthScope.Default,
            user = ShortUser(
              id = UserId("9f310484-963b-446b-af69-797feec6813f"),
              displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("Demurgos"))),
            ),
            isAdministrator = true
          ),
        ),
      )
  }

  @ParameterizedTest
  @MethodSource
  fun fromJsonString(item: SerializationTestItem<UserAuthContext>) {
    val actual = UserAuthContext.fromJsonString(item.jsonString)
    assertEquals(item.value, actual)
  }
}
