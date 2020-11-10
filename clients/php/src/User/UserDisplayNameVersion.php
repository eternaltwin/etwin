<?php declare(strict_types=1);

namespace Etwin\User;

final class UserDisplayNameVersion implements \JsonSerializable {
  private UserDisplayName $value;

  final public function __construct(UserDisplayName $value) {
    $this->value = $value;
  }

  final public function getInner(): UserDisplayName {
    return $this->value;
  }

  final public function jsonSerialize(): array {
    return ["value" => $this->value->jsonSerialize()];
  }

  /**
   * @param mixed $raw
   * @return self
   */
  final public static function jsonDeserialize($raw): self {
    return new self(UserDisplayName::jsonDeserialize($raw["value"]));
  }
}
