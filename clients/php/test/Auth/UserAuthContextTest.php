<?php declare(strict_types=1);

namespace Etwin\Test\Auth;

use Etwin\Auth\AuthScope;
use Etwin\Auth\UserAuthContext;
use Etwin\Test\SerializationTestItem;
use Etwin\User\ShortUser;
use Etwin\User\UserDisplayName;
use Etwin\User\UserDisplayNameVersion;
use Etwin\User\UserDisplayNameVersions;
use Etwin\User\UserId;
use PHPUnit\Framework\TestCase;

final class UserAuthContextTest extends TestCase {
  /**
   * @dataProvider provideFromJson
   * @param SerializationTestItem $item
   */
  public function testFromJson(SerializationTestItem $item): void {
    $actual = UserAuthContext::fromJson($item->getJson());
    $this->assertEquals($item->getValue(), $actual);
  }

  public function provideFromJson(): array {
    return SerializationTestItem::fromTestDir(
      "auth/user-auth-context",
      [
        "demurgos" => new UserAuthContext(
          AuthScope::Default(),
          new ShortUser(
            UserId::fromString("9f310484-963b-446b-af69-797feec6813f"),
            new UserDisplayNameVersions(new UserDisplayNameVersion(new UserDisplayName("Demurgos")), []),
          ),
          true,
        ),
      ],
    );
  }
}
