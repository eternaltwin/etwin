<?php declare(strict_types=1);

namespace Etwin\User;

use Etwin\Core\ObjectType;

final class ShortUser implements \JsonSerializable {
  private UserId $id;
  private UserDisplayNameVersions $displayName;

  final public function __construct(UserId $id, UserDisplayNameVersions $displayName) {
    $this->id = $id;
    $this->displayName = $displayName;
  }

  final public function getId(): UserId {
    return $this->id;
  }

  final public function getDisplayName(): UserDisplayNameVersions {
    return $this->displayName;
  }

  final public function jsonSerialize(): array {
    return [
      "type" => ObjectType::User()->jsonSerialize(),
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
    if ($type !== ObjectType::User()) {
      throw new \TypeError("Invalid `type` value");
    }
    $id = UserId::jsonDeserialize($raw["id"]);
    $displayName = UserDisplayNameVersions::jsonDeserialize($raw["display_name"]);
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
