<?php declare(strict_types=1);

namespace Etwin\Test\User;

use \DateTimeImmutable;
use Etwin\Core\Instant;
use Etwin\Hammerfest\HammerfestServer;
use Etwin\Hammerfest\HammerfestUserId;
use Etwin\Hammerfest\HammerfestUsername;
use Etwin\Hammerfest\ShortHammerfestUser;
use Etwin\Link\HammerfestLink;
use Etwin\Link\LinkAction;
use Etwin\Link\TwinoidLink;
use Etwin\Link\VersionedHammerfestLink;
use Etwin\Link\VersionedLinks;
use Etwin\Link\VersionedTwinoidLink;
use Etwin\Test\SerializationTestItem;
use Etwin\Twinoid\ShortTwinoidUser;
use Etwin\Twinoid\TwinoidUserDisplayName;
use Etwin\Twinoid\TwinoidUserId;
use Etwin\User\ShortUser;
use Etwin\User\User;
use Etwin\User\UserDisplayName;
use Etwin\User\UserDisplayNameVersion;
use Etwin\User\UserDisplayNameVersions;
use Etwin\User\UserId;
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
      "user/user",
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
