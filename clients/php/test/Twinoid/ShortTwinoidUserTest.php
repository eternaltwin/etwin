<?php declare(strict_types=1);

namespace Eternaltwin\Test\Twinoid;

use Eternaltwin\Test\SerializationTestItem;
use Eternaltwin\Twinoid\ShortTwinoidUser;
use Eternaltwin\Twinoid\TwinoidUserDisplayName;
use Eternaltwin\Twinoid\TwinoidUserId;
use PHPUnit\Framework\TestCase;

final class ShortTwinoidUserTest extends TestCase {
  /**
   * @dataProvider provideFromJson
   * @param SerializationTestItem $item
   */
  public function testFromJson(SerializationTestItem $item): void {
    $actual = ShortTwinoidUser::fromJson($item->getJson());
    $this->assertEquals($item->getValue(), $actual);
  }

  public function provideFromJson(): array {
    return SerializationTestItem::fromTestDir(
      "twinoid/short-twinoid-user",
      [
        "demurgos" => new ShortTwinoidUser(
          new TwinoidUserId("38"),
          new TwinoidUserDisplayName("Demurgos"),
        ),
      ],
    );
  }
}
