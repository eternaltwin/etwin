<?php declare(strict_types=1);

// WARNING: DO NOT EDIT THE FILE MANUALLY!
// This file was auto-generated by `cargo xtask php` from the definitions in `xtask/src/metagen/etwin.rs`.

namespace Eternaltwin\Dinoparc;

final class DinoparcDinozName implements \JsonSerializable {
  private string $inner;

  final public function __construct(string $inner) {
    $this->inner = $inner;
  }

  final public function getInner(): string {
    return $this->inner;
  }

  final public function toString(): string {
    return $this->inner;
  }

  final public function __toString(): string {
    return $this->toString();
  }

  final public function jsonSerialize(): string {
    return $this->inner;
  }

  /**
   * @param mixed $raw
   * @return self
   */
  final public static function jsonDeserialize($raw): self {
    return new self($raw);
  }
}