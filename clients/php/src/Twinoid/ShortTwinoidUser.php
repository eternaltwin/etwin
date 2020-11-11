<?php declare(strict_types=1);

namespace Etwin\Twinoid;

use Etwin\Core\ObjectType;

final class ShortTwinoidUser implements \JsonSerializable {
  private TwinoidUserId $id;
  private TwinoidUserDisplayName $displayName;

  final public function __construct(TwinoidUserId $id, TwinoidUserDisplayName $displayName) {
    $this->id = $id;
    $this->displayName = $displayName;
  }

  final public function getId(): TwinoidUserId {
    return $this->id;
  }

  final public function getDisplayName(): TwinoidUserDisplayName {
    return $this->displayName;
  }

  final public function jsonSerialize(): array {
    return [
      "type" => ObjectType::TwinoidUser()->jsonSerialize(),
      "id" => $this->id->jsonSerialize(),
      "display_name" => $this->displayName->jsonSerialize(),
    ];
  }

  /**
   * @param mixed $raw
   * @return self
   */
  final public static function jsonDeserialize($raw): self {
    $type = ObjectType::jsonDeserialize($raw["type"]);
    if ($type !== ObjectType::TwinoidUser()) {
      throw new \TypeError("Invalid `type` value");
    }
    $id = TwinoidUserId::jsonDeserialize($raw["id"]);
    $displayName = TwinoidUserDisplayName::jsonDeserialize($raw["display_name"]);
    return new self($id, $displayName);
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
