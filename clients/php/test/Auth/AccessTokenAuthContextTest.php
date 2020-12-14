<?php declare(strict_types=1);

namespace Etwin\Test\Auth;

use Etwin\Auth\AccessTokenAuthContext;
use Etwin\Auth\AuthScope;
use Etwin\Oauth\OauthClientDisplayName;
use Etwin\Oauth\OauthClientId;
use Etwin\Oauth\OauthClientKey;
use Etwin\Oauth\ShortOauthClient;
use Etwin\Test\SerializationTestItem;
use Etwin\User\ShortUser;
use Etwin\User\UserDisplayName;
use Etwin\User\UserDisplayNameVersion;
use Etwin\User\UserDisplayNameVersions;
use Etwin\User\UserId;
use PHPUnit\Framework\TestCase;

final class AccessTokenAuthContextTest extends TestCase {
  /**
   * @dataProvider provideFromJson
   * @param SerializationTestItem $item
   */
  public function testFromJson(SerializationTestItem $item): void {
    $actual = AccessTokenAuthContext::fromJson($item->getJson());
    $this->assertEquals($item->getValue(), $actual);
  }

  public function provideFromJson(): array {
    return SerializationTestItem::fromTestDir(
      "auth/access-token-auth-context",
      [
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
      ],
    );
  }
}
