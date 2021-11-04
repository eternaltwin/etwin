<?php declare(strict_types=1);

namespace Eternaltwin\Link;

final class VersionedLinks implements \JsonSerializable {
  private VersionedHammerfestLink $hammerfestEs;
  private VersionedHammerfestLink $hammerfestFr;
  private VersionedHammerfestLink $hfestNet;
  private VersionedTwinoidLink $twinoid;

  final public function __construct(VersionedHammerfestLink $hammerfestEs, VersionedHammerfestLink $hammerfestFr, VersionedHammerfestLink $hfestNet, VersionedTwinoidLink $twinoid) {
    $this->hammerfestEs = $hammerfestEs;
    $this->hammerfestFr = $hammerfestFr;
    $this->hfestNet = $hfestNet;
    $this->twinoid = $twinoid;
  }

  final public function getHammerfestEs(): VersionedHammerfestLink {
    return $this->hammerfestEs;
  }

  final public function getHammerfestFr(): VersionedHammerfestLink {
    return $this->hammerfestFr;
  }

  final public function getHfestNet(): VersionedHammerfestLink {
    return $this->hfestNet;
  }

  final public function getTwinoid(): VersionedTwinoidLink {
    return $this->twinoid;
  }

  final public function jsonSerialize(): array {
    return [
      "hammerfest_es" => $this->hammerfestEs->jsonSerialize(),
      "hammerfest_fr" => $this->hammerfestFr->jsonSerialize(),
      "hfest_net" => $this->hfestNet->jsonSerialize(),
      "twinoid" => $this->twinoid->jsonSerialize(),
    ];
  }

  /**
   * @param mixed $raw
   * @return self
   */
  final public static function jsonDeserialize($raw): self {
    $hammerfestEs = VersionedHammerfestLink::jsonDeserialize($raw["hammerfest_es"]);
    $hammerfestFr = VersionedHammerfestLink::jsonDeserialize($raw["hammerfest_fr"]);
    $hfestNet = VersionedHammerfestLink::jsonDeserialize($raw["hfest_net"]);
    $twinoid = VersionedTwinoidLink::jsonDeserialize($raw["twinoid"]);
    return new self($hammerfestEs, $hammerfestFr, $hfestNet, $twinoid);
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
