# Eternaltwin website

## Requirements

- Node 14.13.1
- Rust stable
- Yarn 1.22

## Getting started

```
cp etwin.toml.example etwin.toml
yarn install
yarn start
```

The commands above will install the dependencies, compile the website and start it.
By default, the website starts with an in-memory backend implementation that does not require a database.

See [DB documentation](./docs/db.md) to install and configure a Postgres database, then run `yarn run db:create` or import a database.

## Project tasks

This repository uses `yarn` to run project-related tasks such as building or testing.

The tasks are defined in the `scripts` field of `package.json`, you can run them with `yarn run <taskname>` (or `yarn <taskname>` if there is no ambiguity with existing yarn commands).

The `website` package has more advanced tasks described in its `README.md`, all the other packages have the same structure and tasks:

- `yarn build`: Compile the library
- `yarn test`: Compile the tests and run them
- `yarn lint`: Check for common errors and style issues.
- `yarn format`: Attempt to fix style issues automatically.
- `yarn set version latest'`: Update Yarn itself.
- `yarn up '*' '@!(eternal-twin)/*'`: Update all Typescript dependencies.
- `cargo upgrade --workspace'`: Update all Rust dependencies (requires `cargo-edit`: `cargo install cargo-edit`).
- `cargo release --exclude xtask --exclude etwin_native`: Publish all Rust crates
- `yarn workspaces foreach --no-private --verbose npm publish --access public --tolerate-republish`: Publish all packages
- `cargo workspaces version --no-git-commit patch`: Bump Rust crates

## Code coverage

To get Rust's code coverage, run the following commands:

```
cargo install grcov
export CARGO_INCREMENTAL=0
export RUSTFLAGS="-Zprofile -Ccodegen-units=1 -Copt-level=0 -Clink-dead-code -Coverflow-checks=off"
cargo +nightly test
grcov ./target/debug/ -s . -t html --llvm --branch --ignore-not-existing -o ./target/debug/coverage/
```

The report will be in `./target/debug/coverage/`.

## Configuration

The website is configured using a local `etwin.toml` file. You can copy `etwin.toml.example` and edit its values.
The different configuration parameters are commented in `etwin.toml.example`.

## Wiki

Partially Outdated: See [wiki](https://gitlab.com/eternal-twin/etwin/-/wikis/home) and `README.md` files in package directories for help.
