<?php declare(strict_types=1);

namespace Etwin\Test\Core;

use Etwin\Core\ObjectType;
use PHPUnit\Framework\TestCase;

final class ObjectTypeTest extends TestCase {
  public function testEquality(): void {
    $this->assertEquals(ObjectType::HammerfestUser(), ObjectType::HammerfestUser());
    $this->assertNotEquals(ObjectType::HammerfestUser(), ObjectType::User());
    $this->assertNotEquals(ObjectType::User(), ObjectType::HammerfestUser());
    $this->assertEquals(ObjectType::User(), ObjectType::User());
  }
}
