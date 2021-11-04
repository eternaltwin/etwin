# PHP client for the Eternaltwin API

[![packagist](https://img.shields.io/packagist/v/eternaltwin/etwin)][packagist]

## Usage

```
composer require eternaltwin/etwin
```

```php
<?php declare(strict_types=1);

require_once "./vendor/autoload.php";

use \Eternaltwin\Client\Auth;
use \Eternaltwin\Client\HttpEtwinClient;
use \Eternaltwin\User\UserId;

$client = new HttpEtwinClient("https://eternaltwin.org");
$user = $client->getUser(Auth::Guest(), UserId::fromString("9f310484-963b-446b-af69-797feec6813f"));
var_dump($user);
```

## Contributing

```
composer install
composer test
```

## Publish

```
composer run-script publish
```

[packagist]: https://packagist.org/packages/eternaltwin/etwin
