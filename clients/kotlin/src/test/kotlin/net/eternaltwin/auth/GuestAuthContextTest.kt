package net.eternaltwin.auth;

import net.eternaltwin.SerializationTestItem
import net.eternaltwin.user.*
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import java.util.stream.Stream
import kotlin.test.assertEquals

class GuestAuthContextTest {
  companion object {
    @JvmStatic
    fun fromJsonString(): Stream<SerializationTestItem<GuestAuthContext>> =
      SerializationTestItem.streamFromTestDir(
        "core/auth/guest-auth-context",
        mapOf(
          "guest" to GuestAuthContext(
            scope = AuthScope.Default,
          ),
        ),
      )
  }

  @ParameterizedTest
  @MethodSource
  fun fromJsonString(item: SerializationTestItem<GuestAuthContext>) {
    val actual = GuestAuthContext.fromJsonString(item.jsonString)
    assertEquals(item.value, actual)
  }
}
