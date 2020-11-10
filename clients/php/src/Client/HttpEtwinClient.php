<?php declare(strict_types=1);

namespace Etwin\Client;

use Etwin\User\ShortUser;
use Etwin\User\UserId;
use GuzzleHttp\Client;
use GuzzleHttp\Psr7\Uri;
use GuzzleHttp\Psr7\UriResolver;

class HttpEtwinClient implements EtwinClient {
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

  function getSelf(Auth $auth) {

  }

  function getUser(Auth $auth, UserId $userId): ShortUser {
    $res = $this->client->get(
      $this->resolve(["users", $userId->toString()]),
      [
        "headers" => [
          "Authorization" => $auth->getAuthorizationHeader(),
        ],
      ],
    );
    $resBody = $res->getBody()->getContents();
    return ShortUser::fromJson($resBody);
  }

  /**
   * @param string[] $segments
   * @return Uri
   */
  public function resolve(array $segments): Uri {
    return UriResolver::resolve($this->baseUri, new Uri("api/v1/" . implode("/", $segments)));
  }
}
