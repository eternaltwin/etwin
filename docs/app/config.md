[Home](../index.md) | [Applications](./index.md)

# Application configuration

Every Eternal-Twin game or application must be able to be configured using
either  environment variables or a configuration file.

## Configuration format

### Environment variable

When using environment variables, use `UPPER_SNAKE_CASE`. Prefix all the
variables with an identifier unique to your application.

- Example: `NEOPARC_EXTERNAL_URI` to configure the external URI of Neoparc
  (Dinoparc remake).

### Configuration file

Do not invent your own file format. Use either `.env` files, JSON files or
TOML files.

Provide and example configuration file in your repository.

### Zero configuration

You may allow your application to start without any environement variable or
configuration file. Assume that the application is running locally in
development mode in such case.

## Runtime representation

Your application must fully load the configuration during its initialization.

It must check that the configuration is valid and represent it as a single
value. Pick the representation that best suits your language, usually a class
instance. Avoid untyped maps.

The goal is to avoid ad-hoc configuration access: the reste of the application
should only use this configuration value.

## Configurable values

This section contains a list of values the must configurable.

### Eternal-Twin URI

Eternal-Twin URI, used for OAuth and the API.

Example values:
- `http://localhost:50320/`
- `https://eternal-twin.net/`

### Eternal-Twin OAuth client id

OAuth `client_id` for Eternal-Twin.

Example values:
- `eternalfest@clients`
- `d19e61a3-83d3-410f-84ec-49aaab841559`

### Eternal-Twin OAuth client secret

OAuth `client_secret` for Eternal-Twin.

Example values:
- `dev_secret`
- `8tbuCjaBVkL2HZDh7cH2m2Fdv3CSEgK8`

### External URI

Public URI for the root of the application.

Example values:
- `http://directquiz.localhost/`
- `http://directquiz.eternal-twin.net/`
