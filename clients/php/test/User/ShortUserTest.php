<?php declare(strict_types=1);

namespace Etwin\Test\User;

use Etwin\Test\SerializationTestItem;
use Etwin\User\ShortUser;
use Etwin\User\UserDisplayName;
use Etwin\User\UserDisplayNameVersion;
use Etwin\User\UserDisplayNameVersions;
use Etwin\User\UserId;
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
      "user/short-user",
      [
        "demurgos" => new ShortUser(
          UserId::fromString("9f310484-963b-446b-af69-797feec6813f"),
          new UserDisplayNameVersions(new UserDisplayNameVersion(new UserDisplayName("Demurgos")), []),
        ),
      ],
    );
  }
}
