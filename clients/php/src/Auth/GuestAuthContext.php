<?php declare(strict_types=1);

namespace Etwin\Auth;

final class GuestAuthContext implements \JsonSerializable {
  private AuthScope $scope;

  final public function __construct(AuthScope $scope) {
    $this->scope = $scope;
  }

  final public function getScope(): AuthScope {
    return $this->scope;
  }

  final public function jsonSerialize(): array {
    return [
      "type" => AuthType::Guest()->jsonSerialize(),
      "scope" => $this->scope->jsonSerialize(),
    ];
  }

  /**
   * @param mixed $raw
   * @return self
   */
  final public static function jsonDeserialize($raw): self {
    $type = AuthType::jsonDeserialize($raw["type"]);
    if ($type !== AuthType::Guest()) {
      throw new \TypeError("Invalid `type` value");
    }
    $scope = AuthScope::jsonDeserialize($raw["scope"]);
    return new self($scope);
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
