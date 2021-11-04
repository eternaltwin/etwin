<?php declare(strict_types=1);

namespace Eternaltwin\Test\Auth;

use Eternaltwin\Auth\AccessTokenAuthContext;
use Eternaltwin\Auth\AuthScope;
use Eternaltwin\Auth\AuthContext;
use Eternaltwin\Auth\GuestAuthContext;
use Eternaltwin\Auth\UserAuthContext;
use Eternaltwin\Oauth\OauthClientDisplayName;
use Eternaltwin\Oauth\OauthClientId;
use Eternaltwin\Oauth\OauthClientKey;
use Eternaltwin\Oauth\ShortOauthClient;
use Eternaltwin\Test\SerializationTestItem;
use Eternaltwin\User\ShortUser;
use Eternaltwin\User\UserDisplayName;
use Eternaltwin\User\UserDisplayNameVersion;
use Eternaltwin\User\UserDisplayNameVersions;
use Eternaltwin\User\UserId;
use PHPUnit\Framework\TestCase;

final class AuthContextTest extends TestCase {
  /**
   * @dataProvider provideFromJson
   * @param SerializationTestItem $item
   */
  public function testFromJson(SerializationTestItem $item): void {
    $actual = AuthContext::fromJson($item->getJson());
    $this->assertEquals($item->getValue(), $actual);
  }

  public function provideFromJson(): array {
    return SerializationTestItem::fromTestDir(
      "core/auth/auth-context",
      [
        "demurgos" => new UserAuthContext(
          AuthScope::Default(),
          new ShortUser(
            UserId::fromString("9f310484-963b-446b-af69-797feec6813f"),
            new UserDisplayNameVersions(new UserDisplayNameVersion(new UserDisplayName("Demurgos")), []),
          ),
          true,
        ),
        "eternalfest-demurgos" => new AccessTokenAuthContext(
          AuthScope::Default(),
          new ShortOauthClient(
            OauthClientId::fromString("d19e61a3-83d3-410f-84ec-49aaab841559"),
            new OauthClientKey("eternalfest@clients"),
            new OauthClientDisplayName("Eternalfest"),
          ),
          new ShortUser(
            UserId::fromString("9f310484-963b-446b-af69-797feec6813f"),
            new UserDisplayNameVersions(new UserDisplayNameVersion(new UserDisplayName("Demurgos")), []),
          ),
        ),
        "guest" => new GuestAuthContext(
          AuthScope::Default(),
        ),
      ],
    );
  }
}
