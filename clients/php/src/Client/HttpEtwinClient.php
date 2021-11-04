<?php declare(strict_types=1);

namespace Eternaltwin\Client;

use Eternaltwin\Auth\AccessTokenAuthContext;
use Eternaltwin\Auth\AuthContext;
use Eternaltwin\Auth\GuestAuthContext;
use Eternaltwin\Auth\UserAuthContext;
use Eternaltwin\User\User;
use Eternaltwin\User\UserId;
use GuzzleHttp\Client;
use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\UriResolver;

final class HttpEtwinClient implements EtwinClient {
  const DEFAULT_TIMEOUT = 30.0;

  private Uri $baseUri;
  private Client $client;


  final public function __construct(string $baseUri) {
    $parsedBaseUri = new Uri($baseUri);
    $inputPath = $parsedBaseUri->getPath();
    if (mb_substr($inputPath, -1, 1) != "/") {
      $parsedBaseUri = $parsedBaseUri->withPath($inputPath . "/");
    }
    $this->baseUri = $parsedBaseUri;
    $this->client = new Client(["base_uri" => $parsedBaseUri, "timeout" => self::DEFAULT_TIMEOUT]);
  }

  /**
   * @param Auth $auth
   * @return AccessTokenAuthContext | GuestAuthContext | UserAuthContext
   * @throws \JsonException
   */
  function getSelf(Auth $auth) {
    $res = $this->client->get(
      $this->resolve(["auth", "self"]),
      [
        "headers" => [
          "Authorization" => $auth->getAuthorizationHeader(),
        ],
      ],
    );
    $resBody = $res->getBody()->getContents();
    return AuthContext::fromJson($resBody);
  }

  function getUser(Auth $auth, UserId $userId): User {
    $res = $this->client->get(
      $this->resolve(["users", $userId->toString()]),
      [
        "headers" => [
          "Authorization" => $auth->getAuthorizationHeader(),
        ],
      ],
    );
    $resBody = $res->getBody()->getContents();
    return User::fromJson($resBody);
  }

  /**
   * @param string[] $segments
   * @return Uri
   */
  public function resolve(array $segments): Uri {
    return UriResolver::resolve($this->baseUri, new Uri("api/v1/" . implode("/", $segments)));
  }
}
