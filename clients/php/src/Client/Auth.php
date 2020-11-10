<?php declare(strict_types=1);

namespace Etwin\Client;

final class Auth {
  private static ?self $_Guest;

  private ?string $authorizationHeader;

  final private function __construct(?string $authorizationHeader) {
    $this->authorizationHeader = $authorizationHeader;
  }

  final public function getAuthorizationHeader(): ?string {
    return $this->authorizationHeader;
  }

  final public static function Guest(): self {
    if (!isset(self::$_Guest)) {
      self::$_Guest = new self(null);
    }
    return self::$_Guest;
  }

  final public static function fromToken(string $key): self {
    return new self("Bearer " . $key);
  }
}
