[Home](../index.md) | [Applications](./index.md)

# Eternaltwin API

Eternaltwin exposes all its data through a REST API.
Some resources are protected and require the right authorization.

There are [official clients](https://gitlab.com/eternal-twin/etwin/-/tree/master/clients)
for various platforms. You should use them instead of writing your own client:
- [Kotlin](https://gitlab.com/eternal-twin/etwin/-/tree/master/clients/kotlin)
- [PHP](https://gitlab.com/eternal-twin/etwin/-/tree/master/clients/php)
- [Ruby](https://gitlab.com/eternal-twin/etwin/-/tree/master/clients/ruby)
- [TypeScript](https://gitlab.com/eternal-twin/etwin/-/tree/master/clients/typescript)

See also [the examples](https://gitlab.com/eternal-twin/etwin/-/tree/master/examples)

These clients are not complte yet, help is welcome to improve them.

All the client support retrieving data about the current client and retrieving data about users
(enough to authenticate users with an OAuth access token).
