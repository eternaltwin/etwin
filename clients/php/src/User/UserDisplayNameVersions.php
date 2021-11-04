<?php declare(strict_types=1);

namespace Eternaltwin\User;

final class UserDisplayNameVersions implements \JsonSerializable {
  /**
   * Current display name
   *
   * @var UserDisplayNameVersion
   */
  private UserDisplayNameVersion $current;

  /**
   * Old display names
   *
   * @var UserDisplayNameVersion[]
   */
  // TODO: Use SplFixedArray
  private array $old;

  final public function __construct(UserDisplayNameVersion $current, iterable $old) {
    $this->current = $current;
    $this->old = [];
    foreach ($old as $item) {
      if (!($item instanceof UserDisplayNameVersion)) {
        throw new \TypeError("Invalid old");
      }
    }
  }

  final public function getCurrent(): UserDisplayNameVersion {
    return $this->current;
  }

  final public function getOld(): iterable {
    return $this->old;
  }

  final public function jsonSerialize(): array {
    return [
      "current" => $this->current->jsonSerialize(),
      "old" => array_map("UserDisplayNameVersion::jsonDeserialize", $this->old)
    ];
  }

  /**
   * @param mixed $raw
   * @return self
   */
  final public static function jsonDeserialize($raw): self {
    $current = UserDisplayNameVersion::jsonDeserialize($raw["current"]);
//    $rawOld = $raw["old"];
//    if (!is_array($rawOld)) {
//      throw new \TypeError("Invalid `old` field: expected `array`");
//    }
    $old = [];
//    foreach ($rawOld as $item) {
//      $old[] = UserDisplayNameVersion::jsonDeserialize($item);
//    }
    return new self($current, $old);
  }
}
