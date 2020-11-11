<?php declare(strict_types=1);

namespace Etwin\Link;

use Etwin\Hammerfest\ShortHammerfestUser;

final class HammerfestLink implements \JsonSerializable {
  private LinkAction $link;
  private ?LinkAction $unlink;
  private ShortHammerfestUser $user;

  final public function __construct(LinkAction $link, ?LinkAction $unlink, ShortHammerfestUser $user) {
    $this->link = $link;
    $this->unlink = $unlink;
    $this->user = $user;
  }

  final public function getLink(): LinkAction {
    return $this->link;
  }

  final public function getUnlinkLink(): ?LinkAction {
    return $this->unlink;
  }

  final public function getUser(): ShortHammerfestUser {
    return $this->user;
  }

  final public function jsonSerialize(): array {
    return [
      "link" => $this->link->jsonSerialize(),
      "unlink" => isset($this->unlink) ? $this->unlink->jsonSerialize() : null,
      "user" => $this->user->jsonSerialize(),
    ];
  }

  /**
   * @param mixed $raw
   * @return self
   */
  final public static function jsonDeserialize($raw): self {
    $link = LinkAction::jsonDeserialize($raw["link"]);
    $unlink = isset($raw["unlink"]) ? LinkAction::jsonDeserialize($raw["unlink"]) : null;
    $user = ShortHammerfestUser::jsonDeserialize($raw["user"]);
    return new self($link, $unlink, $user);
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
