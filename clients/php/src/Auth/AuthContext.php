<?php declare(strict_types=1);

namespace Etwin\Auth;

final class AuthContext {
  final private function __construct() {
  }

  /**
   * @param mixed $raw
   * @return AccessTokenAuthContext | GuestAuthContext | UserAuthContext
   */
  final public static function jsonDeserialize($raw) {
    switch ($raw["type"]) {
      case "AccessToken":
        return AccessTokenAuthContext::jsonDeserialize($raw);
      case "Guest":
        return GuestAuthContext::jsonDeserialize($raw);
      case "User":
        return UserAuthContext::jsonDeserialize($raw);
      default:
        throw new \TypeError("Unexpected `type` value");
    }
  }

  /**
   * @param string $json
   * @return AccessTokenAuthContext | GuestAuthContext | UserAuthContext
   * @throws \JsonException
   */
  final public static function fromJson(string $json) {
    return self::jsonDeserialize(json_decode($json, true, 512, JSON_THROW_ON_ERROR));
  }
}
