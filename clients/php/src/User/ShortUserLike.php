<?php declare(strict_types=1);

namespace Eternaltwin\User;

interface ShortUserLike {
  function getId(): UserId;

  function getDisplayName(): UserDisplayNameVersions;
}
