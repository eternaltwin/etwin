# Eternal-Twin main repository

## Getting started

```
cp .env.example .env
yarn install
yarn start
```

The command above will install the dependencies, compile the website and start it.
By default, the website starts with an in-memory backend implementation that does not require a database.

## Configuration

The website is configured using a local `.env` file. You can copy `.env.example` and edit its values.

### `ETWIN_IN_MEMORY`

Run the website using the in-memory backend instead of the Postgres backend.

The in-memory backend stores all the data in RAM. It allows to start the website without configuring the database. The downside is that all the data is lost when stopping the server.

Examples:

```
ETWIN_IN_MEMORY=true
ETWIN_IN_MEMORY=false
```

### `ETWIN_DB_HOST`

Postgres database host.

```
ETWIN_DB_HOST=localhost
```

### `ETWIN_DB_PORT`

Postgres database port.

```
ETWIN_DB_PORT=5432
```

### `ETWIN_DB_NAME`

Postgres database name.

```
ETWIN_DB_NAME=etwindb
```

### `ETWIN_DB_NAME`

Postgres database user.

```
ETWIN_DB_USER=etwin
```

### `ETWIN_DB_PASSWORD`

Postgres database password.

```
ETWIN_DB_PASSWORD=dev
```

### `ETWIN_SECRET_KEY`

Secret key used by the server for cryptography.

```
ETWIN_SECRET_KEY=dev_secret
```

### `ETWIN_HTTP_PORT`

Internal HTTP port. The server will start listening for incoming HTTP requests on this port.

```
ETWIN_HTTP_PORT=50320
```

### `ETWIN_EXTERNAL_BASE_URI`

External URI for this server: this is the URI used by users to reach this server.

```
ETWIN_EXTERNAL_BASE_URI=http://localhost:50320
```

### `ETWIN_ETERNALFEST_APP_URI`

Root URI for the Eternalfest server.

```
ETWIN_ETERNALFEST_APP_URI=http://localhost:50313
```

### `ETWIN_ETERNALFEST_CALLBACK_URI`

Callback URI for the Eternalfest OAuth client.

```
ETWIN_ETERNALFEST_CALLBACK_URI=http://localhost:50313/oauth/callback
```

### `ETWIN_ETERNALFEST_SECRET`

Password for the Eternalfest OAuth client.

```
ETWIN_ETERNALFEST_SECRET=eternalfest_secret
```

## Wiki

Partially Outdated: See [wiki](https://gitlab.com/eternal-twin/etwin/-/wikis/home) and `README.md` files in package directories for help.
