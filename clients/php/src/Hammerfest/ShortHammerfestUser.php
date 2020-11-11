<?php declare(strict_types=1);

namespace Etwin\Hammerfest;

use Etwin\Core\ObjectType;

final class ShortHammerfestUser implements \JsonSerializable {
  private HammerfestServer $server;
  private HammerfestUserId $id;
  private HammerfestUsername $username;

  final public function __construct(HammerfestServer $server, HammerfestUserId $id, HammerfestUsername $username) {
    $this->server = $server;
    $this->id = $id;
    $this->username = $username;
  }

  final public function getServer(): HammerfestServer {
    return $this->server;
  }

  final public function getId(): HammerfestUserId {
    return $this->id;
  }

  final public function getUsername(): HammerfestUsername {
    return $this->username;
  }

  final public function jsonSerialize(): array {
    return [
      "type" => ObjectType::HammerfestUser()->jsonSerialize(),
      "server" => $this->server->jsonSerialize(),
      "id" => $this->id->jsonSerialize(),
      "username" => $this->username->jsonSerialize(),
    ];
  }

  /**
   * @param mixed $raw
   * @return self
   */
  final public static function jsonDeserialize($raw): self {
    $type = ObjectType::jsonDeserialize($raw["type"]);
    if ($type !== ObjectType::HammerfestUser()) {
      throw new \TypeError("Invalid `type` value");
    }
    $server = HammerfestServer::jsonDeserialize($raw["server"]);
    $id = HammerfestUserId::jsonDeserialize($raw["id"]);
    $username = HammerfestUsername::jsonDeserialize($raw["username"]);
    return new self($server, $id, $username);
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
