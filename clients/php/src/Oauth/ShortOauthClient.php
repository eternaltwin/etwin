<?php declare(strict_types=1);

namespace Eternaltwin\Oauth;

use Eternaltwin\Core\ObjectType;

final class ShortOauthClient implements \JsonSerializable {
  private OauthClientId $id;
  private ?OauthClientKey $key;
  private OauthClientDisplayName $displayName;

  final public function __construct(OauthClientId $id, ?OauthClientKey $key, OauthClientDisplayName $displayName) {
    $this->id = $id;
    $this->key = $key;
    $this->displayName = $displayName;
  }

  final public function getId(): OauthClientId {
    return $this->id;
  }

  final public function getDisplayName(): OauthClientDisplayName {
    return $this->displayName;
  }

  final public function jsonSerialize(): array {
    return [
      "type" => ObjectType::OauthClient()->jsonSerialize(),
      "id" => $this->id->jsonSerialize(),
      "key" => $this->key->jsonSerialize(),
      "display_name" => $this->displayName->jsonSerialize(),
    ];
  }

  /**
   * @param mixed $raw
   * @return self
   */
  final public static function jsonDeserialize($raw): self {
    $type = ObjectType::jsonDeserialize($raw["type"]);
    if ($type !== ObjectType::OauthClient()) {
      throw new \TypeError("Invalid `type` value");
    }
    $id = OauthClientId::jsonDeserialize($raw["id"]);
    $key = isset($raw["key"]) ? OauthClientKey::jsonDeserialize($raw["key"]) : null;
    $displayName = OauthClientDisplayName::jsonDeserialize($raw["display_name"]);
    return new self($id, $key, $displayName);
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
