<?php declare(strict_types=1);

namespace Eternaltwin\Core;

final class Instant {
  const FORMAT = "Y-m-d\TH:i:s\.v\Z";

  final private function __construct() {
  }

  /**
   * @param mixed $raw
   * @return \DateTimeImmutable
   */
  final public static function jsonDeserialize($raw): \DateTimeImmutable {
    if (!is_string($raw)) {
      throw new \TypeError("Expected `\Eternaltwin\Core\Instant::jsonDeserialize` input to be a `string`");
    }
    $maybeDate = \DateTimeImmutable::createFromFormat(self::FORMAT, $raw);
    if ($maybeDate == false) {
      throw new \TypeError("Invalid instant format");
    }
    return $maybeDate;
  }

  /**
   * @param string $json
   * @return \DateTimeImmutable
   * @throws \JsonException
   */
  final public static function fromJson(string $json) {
    return self::jsonDeserialize(json_decode($json, true, 512, JSON_THROW_ON_ERROR));
  }
}
