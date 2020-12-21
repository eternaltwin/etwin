# Eternal-Twin in-memory `SimpleUserService`

`SimpleUserService` in-memory implementation: all the data is stored in RAM.

It is intended for local development only in situations where using a Postgres database is not possible.

Please note that data created by this service is not persistent: it is lost when the process is stopped.
