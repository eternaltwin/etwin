<?php declare(strict_types=1);

namespace Etwin\Core;

final class ObjectType implements \JsonSerializable {
  private static ?self $_ClientForumActor;
  private static ?self $_ForumPost;
  private static ?self $_ForumPostRevision;
  private static ?self $_ForumSection;
  private static ?self $_ForumThread;
  private static ?self $_HammerfestUser;
  private static ?self $_OauthClient;
  private static ?self $_RoleForumActor;
  private static ?self $_TwinoidUser;
  private static ?self $_User;
  private static ?self $_UserForumActor;

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
      case "HammerfestUser":
        return self::HammerfestUser();
      case "OauthClient":
        return self::OauthClient();
      case "TwinoidUser":
        return self::TwinoidUser();
      case "User":
        return self::User();
      case "UserForumActor":
        return self::UserForumActor();
      default:
        throw new \TypeError("Unexpected `ObjectType` value");
    }
  }

  final public static function HammerfestUser(): self {
    if (!isset(self::$_HammerfestUser)) {
      self::$_HammerfestUser = new self("HammerfestUser");
    }
    return self::$_HammerfestUser;
  }

  final public static function OauthClient(): self {
    if (!isset(self::$_OauthClient)) {
      self::$_OauthClient = new self("OauthClient");
    }
    return self::$_OauthClient;
  }

  final public static function TwinoidUser(): self {
    if (!isset(self::$_User)) {
      self::$_User = new self("TwinoidUser");
    }
    return self::$_User;
  }

  final public static function User(): self {
    if (!isset(self::$_TwinoidUser)) {
      self::$_TwinoidUser = new self("User");
    }
    return self::$_TwinoidUser;
  }

  final public static function UserForumActor(): self {
    if (!isset(self::$_UserForumActor)) {
      self::$_UserForumActor = new self("UserForumActor");
    }
    return self::$_UserForumActor;
  }
}
