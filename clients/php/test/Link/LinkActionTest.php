<?php declare(strict_types=1);

namespace Eternaltwin\Test\Link;

use \DateTimeImmutable;
use Eternaltwin\Core\Instant;
use Eternaltwin\Link\LinkAction;
use Eternaltwin\Test\SerializationTestItem;
use Eternaltwin\User\ShortUser;
use Eternaltwin\User\UserDisplayName;
use Eternaltwin\User\UserDisplayNameVersion;
use Eternaltwin\User\UserDisplayNameVersions;
use Eternaltwin\User\UserId;
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
