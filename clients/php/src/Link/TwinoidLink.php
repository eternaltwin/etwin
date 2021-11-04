<?php declare(strict_types=1);

namespace Eternaltwin\Link;

use Eternaltwin\Twinoid\ShortTwinoidUser;

final class TwinoidLink implements \JsonSerializable {
  private LinkAction $link;
  private ?LinkAction $unlink;
  private ShortTwinoidUser $user;

  final public function __construct(LinkAction $link, ?LinkAction $unlink, ShortTwinoidUser $user) {
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

  final public function getUser(): ShortTwinoidUser {
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
    $user = ShortTwinoidUser::jsonDeserialize($raw["user"]);
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
