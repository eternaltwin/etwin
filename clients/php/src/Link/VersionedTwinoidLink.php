<?php declare(strict_types=1);

namespace Eternaltwin\Link;

final class VersionedTwinoidLink implements \JsonSerializable {
  private ?TwinoidLink $current;

  final public function __construct(?TwinoidLink $current) {
    $this->current = $current;
  }

  final public function getCurrent(): ?TwinoidLink {
    return $this->current;
  }

  final public function jsonSerialize(): array {
    return [
      "current" => isset($this->current) ? $this->current->jsonSerialize() : null,
    ];
  }

  /**
   * @param mixed $raw
   * @return self
   */
  final public static function jsonDeserialize($raw): self {
    $current = isset($raw["current"]) ? TwinoidLink::jsonDeserialize($raw["current"]) : null;
    return new self($current);
  }

  /**
   * @param string $json
   * @return self
   * @throws \JsonException
   */
  final public static function fromJson(string $json): self {
    return self::jsonDeserialize(json_decode($json, true, 512, JSON_THROW_ON_ERROR));
  }
}
