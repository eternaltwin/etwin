<?php declare(strict_types=1);

namespace Etwin\Test\Twinoid;

use Etwin\Test\SerializationTestItem;
use Etwin\Twinoid\ShortTwinoidUser;
use Etwin\Twinoid\TwinoidUserDisplayName;
use Etwin\Twinoid\TwinoidUserId;
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
