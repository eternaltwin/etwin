<?php declare(strict_types=1);

namespace Eternaltwin\Test\User;

use Eternaltwin\Test\SerializationTestItem;
use Eternaltwin\User\ShortUser;
use Eternaltwin\User\UserDisplayName;
use Eternaltwin\User\UserDisplayNameVersion;
use Eternaltwin\User\UserDisplayNameVersions;
use Eternaltwin\User\UserId;
use PHPUnit\Framework\TestCase;

final class ShortUserTest extends TestCase {
  /**
   * @dataProvider provideFromJson
   * @param SerializationTestItem $item
   */
  public function testFromJson(SerializationTestItem $item): void {
    $actual = ShortUser::fromJson($item->getJson());
    $this->assertEquals($item->getValue(), $actual);
  }

  public function provideFromJson(): array {
    return SerializationTestItem::fromTestDir(
      "core/user/short-user",
      [
        "demurgos" => new ShortUser(
          UserId::fromString("9f310484-963b-446b-af69-797feec6813f"),
          new UserDisplayNameVersions(new UserDisplayNameVersion(new UserDisplayName("Demurgos")), []),
        ),
      ],
    );
  }
}
