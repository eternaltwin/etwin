<?php declare(strict_types=1);

namespace Etwin\User;

interface ShortUserLike {
  function getId(): UserId;

  function getDisplayName(): UserDisplayNameVersions;
}
