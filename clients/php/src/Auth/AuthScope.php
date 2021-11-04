<?php declare(strict_types=1);

namespace Eternaltwin\Auth;

final class AuthScope implements \JsonSerializable {
  private static ?self $_Default;

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
      case "Default":
        return self::Default();
      default:
        throw new \TypeError("Unexpected `AuthScope` value");
    }
  }

  final public static function Default(): self {
    if (!isset(self::$_Default)) {
      self::$_Default = new self("Default");
    }
    return self::$_Default;
  }
}
