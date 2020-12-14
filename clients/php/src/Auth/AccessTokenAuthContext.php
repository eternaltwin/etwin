<?php declare(strict_types=1);

namespace Etwin\Auth;

use Etwin\Oauth\ShortOauthClient;
use Etwin\User\ShortUser;

final class AccessTokenAuthContext implements \JsonSerializable {
  private AuthScope $scope;
  private ShortOauthClient $client;
  private ShortUser $user;

  final public function __construct(AuthScope $scope, ShortOauthClient $client, ShortUser $user) {
    $this->scope = $scope;
    $this->client = $client;
    $this->user = $user;
  }

  final public function getScope(): AuthScope {
    return $this->scope;
  }

  final public function getClient(): ShortOauthClient {
    return $this->client;
  }

  final public function getUser(): ShortUser {
    return $this->user;
  }

  final public function jsonSerialize(): array {
    return [
      "type" => AuthType::AccessToken()->jsonSerialize(),
      "scope" => $this->scope->jsonSerialize(),
      "client" => $this->client->jsonSerialize(),
      "user" => $this->user->jsonSerialize(),
    ];
  }

  /**
   * @param mixed $raw
   * @return self
   */
  final public static function jsonDeserialize($raw): self {
    $type = AuthType::jsonDeserialize($raw["type"]);
    if ($type !== AuthType::AccessToken()) {
      throw new \TypeError("Invalid `type` value");
    }
    $scope = AuthScope::jsonDeserialize($raw["scope"]);
    $client = ShortOauthClient::jsonDeserialize($raw["client"]);
    $user = ShortUser::jsonDeserialize($raw["user"]);
    return new self($scope, $client, $user);
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
