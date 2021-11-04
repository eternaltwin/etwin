<?php declare(strict_types=1);

namespace Eternaltwin\Auth;

use Eternaltwin\User\ShortUser;

final class UserAuthContext implements \JsonSerializable {
  private AuthScope $scope;
  private ShortUser $user;
  private bool $isAdministrator;

  final public function __construct(AuthScope $scope, ShortUser $user, bool $isAdministrator) {
    $this->scope = $scope;
    $this->user = $user;
    $this->isAdministrator = $isAdministrator;
  }

  final public function getScope(): AuthScope {
    return $this->scope;
  }

  final public function getUser(): ShortUser {
    return $this->user;
  }

  final public function isAdministrator(): bool {
    return $this->isAdministrator;
  }

  final public function jsonSerialize(): array {
    return [
      "type" => AuthType::User()->jsonSerialize(),
      "scope" => $this->scope->jsonSerialize(),
      "user" => $this->user->jsonSerialize(),
      "is_administrator" => $this->isAdministrator,
    ];
  }

  /**
   * @param mixed $raw
   * @return self
   */
  final public static function jsonDeserialize($raw): self {
    $type = AuthType::jsonDeserialize($raw["type"]);
    if ($type !== AuthType::User()) {
      throw new \TypeError("Invalid `type` value");
    }
    $scope = AuthScope::jsonDeserialize($raw["scope"]);
    $user = ShortUser::jsonDeserialize($raw["user"]);
    $isAdministrator = $raw["is_administrator"];
    return new self($scope, $user, $isAdministrator);
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
