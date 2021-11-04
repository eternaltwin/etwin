<?php declare(strict_types=1);

namespace Eternaltwin\Link;

use \DateTimeImmutable;
use Eternaltwin\Core\Instant;
use Eternaltwin\User\ShortUser;

final class LinkAction implements \JsonSerializable {
  private DateTimeImmutable $time;
  private ShortUser $user;

  final public function __construct(DateTimeImmutable $time, ShortUser $user) {
    $this->time = $time;
    $this->user = $user;
  }

  final public function getTime(): DateTimeImmutable {
    return $this->time;
  }

  final public function getUser(): ShortUser {
    return $this->user;
  }

  final public function jsonSerialize(): array {
    return [
      "time" => $this->time,
      "user" => $this->user->jsonSerialize(),
    ];
  }

  /**
   * @param mixed $raw
   * @return self
   */
  final public static function jsonDeserialize($raw): self {
    $id = Instant::jsonDeserialize($raw["time"]);
    $user = ShortUser::jsonDeserialize($raw["user"]);
    return new self($id, $user);
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
