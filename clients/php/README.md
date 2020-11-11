# PHP client for the Eternal-Twin API

## Usage

```
composer require eternal-twin/etwin
```

```php
<?php declare(strict_types=1);

require_once "./vendor/autoload.php";

use \Etwin\Client\Auth;
use \Etwin\Client\HttpEtwinClient;
use \Etwin\User\UserId;

$client = new HttpEtwinClient("https://eternal-twin.net");
$user = $client->getUser(Auth::Guest(), UserId::fromString("9f310484-963b-446b-af69-797feec6813f"));
var_dump($user);
```

## Contributing

```
composer install
composer exec -- phpunit --testdox test
```
