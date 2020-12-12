[Home](./index.md)

# Database

Eternal-Twin uses Postgres as its main database.

## Initialize the Postgres cluster

```sh
# Run as the Postgres user
initdb --locale "en_US.UTF-8" --encoding="UTF8" --pgdata="/var/lib/postgres/data/"
```

Example

```sh
[postgres@red ~]$ initdb --locale "en_US.UTF-8" --encoding="UTF8" --pgdata="/var/lib/postgres/data/"
The files belonging to this database system will be owned by user "postgres".
This user must also own the server process.

The database cluster will be initialized with locale "en_US.UTF-8".
The default text search configuration will be set to "english".

Data page checksums are disabled.

fixing permissions on existing directory /var/lib/postgres/data ... ok
creating subdirectories ... ok
selecting dynamic shared memory implementation ... posix
selecting default max_connections ... 100
selecting default shared_buffers ... 128MB
selecting default time zone ... Europe/Paris
creating configuration files ... ok
running bootstrap script ... ok
performing post-bootstrap initialization ... ok
syncing data to disk ... ok

initdb: warning: enabling "trust" authentication for local connections
You can change this by editing pg_hba.conf or using the option -A, or
--auth-local and --auth-host, the next time you run initdb.

Success. You can now start the database server using:

    pg_ctl -D /var/lib/postgres/data/ -l logfile start

```

## Create a dev DB superuser

```sh
# Run as the Postgres user
createuser --encrypted --interactive --pwprompt
```

Example

```sh
postgres@host $ createuser --encrypted --interactive --pwprompt
Enter name of role to add: etwin
Enter password for new role: dev
Enter it again: dev
Shall the new role be a superuser? (y/n) y
```

## Create a DB

```sh
createdb --owner=<dbuser> <dbname>
psql <dbname>
ALTER SCHEMA public OWNER TO <dbuser>;
```

Example:

```sh
$ createdb --owner=etwin etwindb
$ psql etwindb
psql (9.6.10)
Type "help" for help.

etwindb=# ALTER SCHEMA public OWNER TO etwin;
```

## PgCrypto

Enable pgcrypto.

```
$ psql dbname
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```
