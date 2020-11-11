<?php declare(strict_types=1);

namespace Etwin\Hammerfest;

final class HammerfestServer implements \JsonSerializable {
  private static ?self $_HammerfestEs;
  private static ?self $_HammerfestFr;
  private static ?self $_HfestNet;

  private string $inner;

  final private function __construct(string $inner) {
    $this->inner = $inner;
  }

  final public function jsonSerialize(): string {
    return $this->inner;
  }

  final public function toString(): string {
    return $this->inner;
  }

  final public static function jsonDeserialize($raw): self {
    return self::fromString($raw);
  }

  final public static function fromString(string $raw): self {
    switch ($raw) {
      case "hammerfest.es":
        return self::HammerfestEs();
      case "hammerfest.fr":
        return self::HammerfestFr();
      case "hfest.net":
        return self::HfestNet();
      default:
        throw new \TypeError("Unexpected `HammerfestServer` value");
    }
  }

  final public static function HammerfestEs(): self {
    if (!isset(self::$_HammerfestEs)) {
      self::$_HammerfestEs = new self("hammerfest.es");
    }
    return self::$_HammerfestEs;
  }

  final public static function HammerfestFr(): self {
    if (!isset(self::$_HammerfestFr)) {
      self::$_HammerfestFr = new self("hammerfest.fr");
    }
    return self::$_HammerfestFr;
  }

  final public static function HfestNet(): self {
    if (!isset(self::$_HfestNet)) {
      self::$_HfestNet = new self("hfest.net");
    }
    return self::$_HfestNet;
  }
}
