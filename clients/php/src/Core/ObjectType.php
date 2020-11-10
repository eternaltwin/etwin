<?php declare(strict_types=1);

namespace Etwin\Core;

final class ObjectType implements \JsonSerializable {
  private static ?self $_HammerfestUser;
  private static ?self $_User;

  private string $inner;

  final private function __construct(string $inner) {
    $this->inner = $inner;
  }

  final public function jsonSerialize(): string {
    return $this->inner;
  }

  final public function toString(): string {
    return $this->inner;
  }

  final public static function jsonDeserialize($raw): self {
    return self::fromString($raw);
  }

  final public static function fromString(string $raw): self {
    switch ($raw) {
      case "HammerfestUser":
        return self::HammerfestUser();
      case "User":
        return self::User();
      default:
        throw new \TypeError("Unexpected `ObjectType` value");
    }
  }

  final public static function HammerfestUser(): self {
    if (!isset(self::$_HammerfestUser)) {
      self::$_HammerfestUser = new ObjectType("HammerfestUser");
    }
    return self::$_HammerfestUser;
  }

  final public static function User(): self {
    if (!isset(self::$_User)) {
      self::$_User = new ObjectType("User");
    }
    return self::$_User;
  }
}
