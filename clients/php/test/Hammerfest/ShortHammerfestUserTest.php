<?php declare(strict_types=1);

namespace Etwin\Test\Hammerfest;

use Etwin\Hammerfest\HammerfestServer;
use Etwin\Hammerfest\HammerfestUserId;
use Etwin\Hammerfest\HammerfestUsername;
use Etwin\Hammerfest\ShortHammerfestUser;
use Etwin\Test\SerializationTestItem;
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
      "hammerfest/short-hammerfest-user",
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
