# Database

Eternal-Twin uses Postgres as its main database.

## Create a DB user

```sh
# Run as the Postgres user
createuser --encrypted --interactive --pwprompt
```

Example

```sh
postgres@host $ createuser --encrypted --interactive --pwprompt
Enter name of role to add: etwin
Shall the new role be a superuser? (y/n) n
Shall the new role be allowed to create databases? (y/n) n
Shall the new role be allowed to create more new roles? (y/n) n
```

## Create a DB

```sh
createdb --owner=dbuser dbname
psql dbname
ALTER SCHEMA public OWNER TO dbuser;
```

Example:

```sh
$ createdb --owner=etwin etwindb
$ psql etwindb
psql (9.6.10)
Type "help" for help.

etwindb=# ALTER SCHEMA public OWNER TO etwin;
```
