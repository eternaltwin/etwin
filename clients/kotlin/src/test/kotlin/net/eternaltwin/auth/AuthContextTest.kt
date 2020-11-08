package net.eternaltwin.auth;

import net.eternaltwin.SerializationTestItem
import net.eternaltwin.user.*
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import java.util.stream.Stream
import kotlin.test.assertEquals

class AuthContextTest {
  companion object {
    @JvmStatic
    fun fromJsonString(): Stream<SerializationTestItem<AuthContext>> =
      SerializationTestItem.streamFromTestDir(
        "auth/auth-context",
        mapOf(
          "demurgos" to AuthContext.User(
            UserAuthContext(
              scope = AuthScope.Default,
              user = ShortUser(
                id = UserId("9f310484-963b-446b-af69-797feec6813f"),
                displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("Demurgos"))),
              ),
              isAdministrator = true
            )
          ),
          "guest" to AuthContext.Guest(
            GuestAuthContext(
              scope = AuthScope.Default,
            )
          ),
        ),
      )
  }

  @ParameterizedTest
  @MethodSource
  fun fromJsonString(item: SerializationTestItem<AuthContext>) {
    val actual = AuthContext.fromJsonString(item.jsonString)
    assertEquals(item.value, actual)
  }
}
