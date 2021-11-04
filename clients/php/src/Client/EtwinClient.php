<?php declare(strict_types=1);

namespace Eternaltwin\Client;

use Eternaltwin\Auth\AccessTokenAuthContext;
use Eternaltwin\Auth\GuestAuthContext;
use Eternaltwin\Auth\UserAuthContext;
use Eternaltwin\User\User;
use Eternaltwin\User\UserId;

interface EtwinClient {
  /**
   * @param Auth $auth
   * @return AccessTokenAuthContext | GuestAuthContext | UserAuthContext
   */
  function getSelf(Auth $auth);

  function getUser(Auth $auth, UserId $userId): User;
}
