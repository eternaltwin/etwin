<?php declare(strict_types=1);

namespace Eternaltwin\Test\Auth;

use Eternaltwin\Auth\AuthScope;
use Eternaltwin\Auth\UserAuthContext;
use Eternaltwin\Test\SerializationTestItem;
use Eternaltwin\User\ShortUser;
use Eternaltwin\User\UserDisplayName;
use Eternaltwin\User\UserDisplayNameVersion;
use Eternaltwin\User\UserDisplayNameVersions;
use Eternaltwin\User\UserId;
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
      "core/auth/user-auth-context",
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
