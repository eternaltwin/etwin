<?php declare(strict_types=1);

namespace Eternaltwin\Test\User;

use \DateTimeImmutable;
use Eternaltwin\Core\Instant;
use Eternaltwin\Hammerfest\HammerfestServer;
use Eternaltwin\Hammerfest\HammerfestUserId;
use Eternaltwin\Hammerfest\HammerfestUsername;
use Eternaltwin\Hammerfest\ShortHammerfestUser;
use Eternaltwin\Link\HammerfestLink;
use Eternaltwin\Link\LinkAction;
use Eternaltwin\Link\TwinoidLink;
use Eternaltwin\Link\VersionedHammerfestLink;
use Eternaltwin\Link\VersionedLinks;
use Eternaltwin\Link\VersionedTwinoidLink;
use Eternaltwin\Test\SerializationTestItem;
use Eternaltwin\Twinoid\ShortTwinoidUser;
use Eternaltwin\Twinoid\TwinoidUserDisplayName;
use Eternaltwin\Twinoid\TwinoidUserId;
use Eternaltwin\User\ShortUser;
use Eternaltwin\User\User;
use Eternaltwin\User\UserDisplayName;
use Eternaltwin\User\UserDisplayNameVersion;
use Eternaltwin\User\UserDisplayNameVersions;
use Eternaltwin\User\UserId;
use PHPUnit\Framework\TestCase;

final class UserTest extends TestCase {
  /**
   * @dataProvider provideFromJson
   * @param SerializationTestItem $item
   */
  public function testFromJson(SerializationTestItem $item): void {
    $actual = User::fromJson($item->getJson());
    $this->assertEquals($item->getValue(), $actual);
  }

  public function provideFromJson(): array {
    return SerializationTestItem::fromTestDir(
      "core/user/user",
      [
        "demurgos" => new User(
          UserId::fromString("9f310484-963b-446b-af69-797feec6813f"),
          new UserDisplayNameVersions(new UserDisplayNameVersion(new UserDisplayName("Demurgos")), []),
          true,
          new VersionedLinks(
            new VersionedHammerfestLink(null),
            new VersionedHammerfestLink(
              new HammerfestLink(
                new LinkAction(
                  DateTimeImmutable::createFromFormat(Instant::FORMAT, "2017-05-25T23:12:50.000Z"),
                  new ShortUser(
                    UserId::fromString("9f310484-963b-446b-af69-797feec6813f"),
                    new UserDisplayNameVersions(new UserDisplayNameVersion(new UserDisplayName("Demurgos")), []),
                  ),
                ),
                null,
                new ShortHammerfestUser(
                  HammerfestServer::HammerfestFr(),
                  new HammerfestUserId("127"),
                  new HammerfestUsername("elseabora"),
                ),
              ),
            ),
            new VersionedHammerfestLink(
              new HammerfestLink(
                new LinkAction(
                  DateTimeImmutable::createFromFormat(Instant::FORMAT, "2017-05-25T23:13:12.000Z"),
                  new ShortUser(
                    UserId::fromString("9f310484-963b-446b-af69-797feec6813f"),
                    new UserDisplayNameVersions(new UserDisplayNameVersion(new UserDisplayName("Demurgos")), []),
                  ),
                ),
                null,
                new ShortHammerfestUser(
                  HammerfestServer::HfestNet(),
                  new HammerfestUserId("205769"),
                  new HammerfestUsername("Demurgos"),
                ),
              ),
            ),
            new VersionedTwinoidLink(
              new TwinoidLink(
                new LinkAction(
                  DateTimeImmutable::createFromFormat(Instant::FORMAT, "2020-10-26T18:53:14.493Z"),
                  new ShortUser(
                    UserId::fromString("9f310484-963b-446b-af69-797feec6813f"),
                    new UserDisplayNameVersions(new UserDisplayNameVersion(new UserDisplayName("Demurgos")), []),
                  ),
                ),
                null,
                new ShortTwinoidUser(
                  new TwinoidUserId("38"),
                  new TwinoidUserDisplayName("Demurgos"),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
