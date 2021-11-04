<?php declare(strict_types=1);

namespace Eternaltwin\Test\Auth;

use Eternaltwin\Auth\AuthScope;
use Eternaltwin\Auth\GuestAuthContext;
use Eternaltwin\Test\SerializationTestItem;
use PHPUnit\Framework\TestCase;

final class GuestAuthContextTest extends TestCase {
  /**
   * @dataProvider provideFromJson
   * @param SerializationTestItem $item
   */
  public function testFromJson(SerializationTestItem $item): void {
    $actual = GuestAuthContext::fromJson($item->getJson());
    $this->assertEquals($item->getValue(), $actual);
  }

  public function provideFromJson(): array {
    return SerializationTestItem::fromTestDir(
      "core/auth/guest-auth-context",
      [
        "guest" => new GuestAuthContext(
          AuthScope::Default(),
        ),
      ],
    );
  }
}
