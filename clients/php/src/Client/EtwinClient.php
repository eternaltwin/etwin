<?php declare(strict_types=1);

namespace Etwin\Client;

use Etwin\Auth\AccessTokenAuthContext;
use Etwin\Auth\GuestAuthContext;
use Etwin\Auth\UserAuthContext;
use Etwin\User\User;
use Etwin\User\UserId;

interface EtwinClient {
  /**
   * @param Auth $auth
   * @return AccessTokenAuthContext | GuestAuthContext | UserAuthContext
   */
  function getSelf(Auth $auth);

  function getUser(Auth $auth, UserId $userId): User;
}
