<?php declare(strict_types=1);

namespace Etwin\User;

use Ramsey\Uuid\Uuid;
use Ramsey\Uuid\UuidInterface;

final class UserId implements \JsonSerializable {
  private UuidInterface $inner;

  final public function __construct(UuidInterface $inner) {
    $this->inner = $inner;
  }

  final public function getInner(): UuidInterface {
    return $this->inner;
  }

  final public function jsonSerialize(): string {
    return $this->inner->jsonSerialize();
  }

  final public function toString(): string {
    return $this->inner->toString();
  }

  final public function __toString(): string {
    return $this->toString();
  }

  final public static function fromString(string $raw): self {
    return new self(Uuid::fromString($raw));
  }

  /**
   * @param mixed $raw
   * @return self
   */
  final public static function jsonDeserialize($raw): self {
    return self::fromString($raw);
  }
}
