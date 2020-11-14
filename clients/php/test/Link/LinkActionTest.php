<?php declare(strict_types=1);

namespace Etwin\Test\Link;

use \DateTimeImmutable;
use Etwin\Core\Instant;
use Etwin\Link\LinkAction;
use Etwin\Test\SerializationTestItem;
use Etwin\User\ShortUser;
use Etwin\User\UserDisplayName;
use Etwin\User\UserDisplayNameVersion;
use Etwin\User\UserDisplayNameVersions;
use Etwin\User\UserId;
use PHPUnit\Framework\TestCase;

final class LinkActionTest extends TestCase {
  /**
   * @dataProvider provideFromJson
   * @param SerializationTestItem $item
   */
  public function testFromJson(SerializationTestItem $item): void {
    $actual = LinkAction::fromJson($item->getJson());
    $this->assertEquals($item->getValue(), $actual);
  }

  public function provideFromJson(): array {
    return SerializationTestItem::fromTestDir(
      "link/link-action",
      [
        "demurgos" => new LinkAction(
          DateTimeImmutable::createFromFormat(Instant::FORMAT, "2017-05-25T23:12:50.001Z"),
          new ShortUser(
            UserId::fromString("9f310484-963b-446b-af69-797feec6813f"),
            new UserDisplayNameVersions(new UserDisplayNameVersion(new UserDisplayName("Demurgos")), []),
          ),
        ),
      ],
    );
  }
}
