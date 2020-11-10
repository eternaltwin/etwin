<?php declare(strict_types=1);

namespace Etwin\Client;

use Etwin\User\ShortUser;
use Etwin\User\UserId;

interface EtwinClient {
  function getSelf(Auth $auth);

  function getUser(Auth $auth, UserId $userId): ShortUser;
}
