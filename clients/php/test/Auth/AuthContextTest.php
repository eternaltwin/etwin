<?php declare(strict_types=1);

namespace Etwin\Test\Auth;

use Etwin\Auth\AuthScope;
use Etwin\Auth\AuthContext;
use Etwin\Auth\GuestAuthContext;
use Etwin\Auth\UserAuthContext;
use Etwin\Test\SerializationTestItem;
use Etwin\User\ShortUser;
use Etwin\User\UserDisplayName;
use Etwin\User\UserDisplayNameVersion;
use Etwin\User\UserDisplayNameVersions;
use Etwin\User\UserId;
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
      "auth/auth-context",
      [
        "demurgos" => new UserAuthContext(
          AuthScope::Default(),
          new ShortUser(
            UserId::fromString("9f310484-963b-446b-af69-797feec6813f"),
            new UserDisplayNameVersions(new UserDisplayNameVersion(new UserDisplayName("Demurgos")), []),
          ),
          true,
        ),
        "guest" => new GuestAuthContext(
          AuthScope::Default(),
        ),
      ],
    );
  }
}
