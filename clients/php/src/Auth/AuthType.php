<?php declare(strict_types=1);

namespace Eternaltwin\Auth;

final class AuthType implements \JsonSerializable {
  private static ?self $_AccessToken;
  private static ?self $_Guest;
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
      case "AccessToken":
        return self::AccessToken();
      case "Guest":
        return self::Guest();
      case "User":
        return self::User();
      default:
        throw new \TypeError("Unexpected `AuthType` value");
    }
  }

  final public static function AccessToken(): self {
    if (!isset(self::$_AccessToken)) {
      self::$_AccessToken = new self("AccessToken");
    }
    return self::$_AccessToken;
  }

  final public static function Guest(): self {
    if (!isset(self::$_Guest)) {
      self::$_Guest = new self("Guest");
    }
    return self::$_Guest;
  }

  final public static function User(): self {
    if (!isset(self::$_User)) {
      self::$_User = new self("User");
    }
    return self::$_User;
  }
}
