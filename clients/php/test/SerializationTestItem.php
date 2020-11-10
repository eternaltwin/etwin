<?php declare(strict_types=1);

namespace Etwin\Test;

final class SerializationTestItem {
  private string $json;
  /**
   * @var mixed
   */
  private $value;

  /**
   * @param string $json
   * @param mixed $value
   */
  final private function __construct(string $json, $value) {
    $this->json = $json;
    $this->value = $value;
  }

  public function getJson(): string {
    return $this->json;
  }

  public function getValue() {
    return $this->value;
  }

  public static function fromTestDir(string $group, array $values): array {
    $testResourcesPath = self::joinPath(__DIR__, "../../../test-resources");
    $groupPath = self::joinPath($testResourcesPath, $group);
    $groupEntities = scandir($groupPath);
    if ($groupEntities === false) {
      throw new \Exception("Failed to scan directory: " . $groupPath);
    }
    // Set of actual item names
    $actualItemNames = [];
    $testItems = [];
    foreach ($groupEntities as $name) {
      if (mb_substr($name, 0, 1) === ".") {
        continue;
      }
      $itemPath = self::joinPath($groupPath, $name);
      if (!is_dir($itemPath)) {
        continue;
      }
      $actualItemNames[$itemPath] = $itemPath;
      if (!array_key_exists($name, $values)) {
        throw new \Exception("Missing test value for " . $group . " > " . $name);
      }
      $value = $values[$name];
      $valuePath = self::joinPath($itemPath, "value.json");
      $json = file_get_contents($valuePath);
      if ($json === false) {
        throw new \Exception("Failed to read value file: " . $valuePath);
      }
      $testItems[$name] = [new SerializationTestItem($json, $value)];
    }
    if (count($values) > count($actualItemNames)) {
      $difference = [];
      foreach(array_keys($values) as $valueKey) {
        if (!array_key_exists($valueKey, $actualItemNames)) {
          $difference[] = $valueKey;
        }
      }
      throw new \Exception("Extra test values: " . join(", ", $difference));
    }

    return $testItems;
  }

  private static function joinPath(string $base, string $extra): string {
    $paths = [];
    if ($base !== "") {
      $paths[] = $base;
    }
    if ($extra !== "") {
      $paths[] = $extra;
    }

    return preg_replace("#/+#", "/", join("/", $paths));
  }
}
