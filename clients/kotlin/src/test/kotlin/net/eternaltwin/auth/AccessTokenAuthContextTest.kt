package net.eternaltwin.auth;

import net.eternaltwin.SerializationTestItem
import net.eternaltwin.oauth.OauthClientDisplayName
import net.eternaltwin.oauth.OauthClientId
import net.eternaltwin.oauth.OauthClientKey
import net.eternaltwin.oauth.ShortOauthClient
import net.eternaltwin.user.*
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import java.util.stream.Stream
import kotlin.test.assertEquals

class AccessTokenAuthContextTest {
  companion object {
    @JvmStatic
    fun fromJsonString(): Stream<SerializationTestItem<AccessTokenAuthContext>> =
      SerializationTestItem.streamFromTestDir(
        "auth/access-token-auth-context",
        mapOf(
          "eternalfest-demurgos" to AccessTokenAuthContext(
            scope = AuthScope.Default,
            client = ShortOauthClient(
              id = OauthClientId("d19e61a3-83d3-410f-84ec-49aaab841559"),
              key = OauthClientKey("eternalfest@clients"),
              displayName = OauthClientDisplayName("Eternalfest"),
            ),
            user = ShortUser(
              id = UserId("9f310484-963b-446b-af69-797feec6813f"),
              displayName = UserDisplayNameVersions(UserDisplayNameVersion(UserDisplayName("Demurgos"))),
            )
          ),
        ),
      )
  }

  @ParameterizedTest
  @MethodSource
  fun fromJsonString(item: SerializationTestItem<AccessTokenAuthContext>) {
    val actual = AccessTokenAuthContext.fromJsonString(item.jsonString)
    assertEquals(item.value, actual)
  }
}
