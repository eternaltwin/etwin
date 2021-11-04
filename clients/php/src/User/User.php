<?php declare(strict_types=1);

namespace Eternaltwin\User;

use Eternaltwin\Core\ObjectType;
use Eternaltwin\Link\VersionedLinks;

final class User implements \JsonSerializable, ShortUserLike {
  private UserId $id;
  private UserDisplayNameVersions $displayName;
  private bool $isAdminitrator;
  private VersionedLinks $links;

  final public function __construct(UserId $id, UserDisplayNameVersions $displayName, bool $isAdminitrator, VersionedLinks $links) {
    $this->id = $id;
    $this->displayName = $displayName;
    $this->isAdminitrator = $isAdminitrator;
    $this->links = $links;
  }

  final public function getId(): UserId {
    return $this->id;
  }

  final public function getDisplayName(): UserDisplayNameVersions {
    return $this->displayName;
  }

  final public function isAdministrator(): bool {
    return $this->isAdminitrator;
  }

  final public function getLinks(): VersionedLinks {
    return $this->links;
  }

  final public function jsonSerialize(): array {
    return [
      "type" => ObjectType::User()->jsonSerialize(),
      "id" => $this->id->jsonSerialize(),
      "display_name" => $this->displayName->jsonSerialize(),
      "is_administrator" => $this->isAdminitrator,
      "links" => $this->links->jsonSerialize(),
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
    $isAdministrator = $raw["is_administrator"];
    $links = VersionedLinks::jsonDeserialize($raw["links"]);
    return new self($id, $displayName, $isAdministrator, $links);
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
