<?php declare(strict_types=1);

namespace Eternaltwin\Test\Hammerfest;

use Eternaltwin\Hammerfest\HammerfestServer;
use Eternaltwin\Hammerfest\HammerfestUserId;
use Eternaltwin\Hammerfest\HammerfestUsername;
use Eternaltwin\Hammerfest\ShortHammerfestUser;
use Eternaltwin\Test\SerializationTestItem;
use PHPUnit\Framework\TestCase;

final class ShortHammerfestUserTest extends TestCase {
  /**
   * @dataProvider provideFromJson
   * @param SerializationTestItem $item
   */
  public function testFromJson(SerializationTestItem $item): void {
    $actual = ShortHammerfestUser::fromJson($item->getJson());
    $this->assertEquals($item->getValue(), $actual);
  }

  public function provideFromJson(): array {
    return SerializationTestItem::fromTestDir(
      "core/hammerfest/short-hammerfest-user",
      [
        "demurgos" => new ShortHammerfestUser(
          HammerfestServer::HfestNet(),
          new HammerfestUserId("205769"),
          new HammerfestUsername("Demurgos"),
        ),
        "elseabora" => new ShortHammerfestUser(
          HammerfestServer::HammerfestFr(),
          new HammerfestUserId("127"),
          new HammerfestUsername("elseabora"),
        ),
      ],
    );
  }
}
