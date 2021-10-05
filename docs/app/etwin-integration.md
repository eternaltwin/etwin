[Home](../index.md) | [Applications](./index.md)

# Eternaltwin Integration

This section describes how to integrate Eternaltwin into your project's
repository. Integrating Eternaltwin to your repository allows you to run and
test your project using a locally installed version of the Eternaltwin website.

Eternaltwin is installed as a project-local Node package:
- it ensures all the contributors use the same version
- the project is fully self-contained and does not require an internet
  connection to run
- if you have multiple projects on your computer, there are no conflicts: each
  one has its own Eternaltwin version.

The packaged version is not the full website (for example, it does not include
translations). It's a lightweight version specifically intended to be installed
inside other projects.

## System requirements

You need the following tools on your system:
- [Node.js](../tools/node.md): Version `14.13.1` or higher
- [Yarn](../tools/yarn.md)

If your system is not a 64-bit Linux or Windows, you also need [Rust](https://rustup.rs/) to
complete the installation by compiling part of the package. If you have a 64-bit Linux or Windows,
Rust is optional.

**ℹ** Using **npm** as an alternative to **yarn** is not officially supported but should work.

## Configure your repository for Node packages

Your repository must contain a `package.json` file at its root. It is a
manifest file containing metadata for Node.js.

If your project does not have a `package.json`, you may create one by running
the following command at the repo root and replying to the prompts:

```
yarn init .
```

You may read the [Yarn](https://yarnpkg.com/configuration/manifest) or
[npm](https://docs.npmjs.com/cli/v6/configuring-npm/package-json) documentation
if you wish to learn more about `package.json` files.

Below is an example minimal `package.json` file.

```json
{
  "name": "myproject",
  "version": "0.0.1",
  "licenses": [
    {
      "type": "AGPL-3.0-or-later",
      "url": "https://spdx.org/licenses/AGPL-3.0-or-later.html"
    }
  ],
  "private": true,
  "scripts": {},
  "dependencies": {},
  "devDependencies": {}
}
```

Make sure to commit the `package.json` file.

## Install Eternaltwin inside your project

Run the following command in the directory containing `package.json`:

```
yarn add --dev @eternal-twin/cli
```

This will perform the following 3 actions:
1. Update your `package.json` file to document the new dependency on the package `@eternal-twin/cli`.
2. Download the package (and its own dependencies) into the `node_modules` directory.
3. Create (or update) a `yarn.lock` file to remember the exact version of the dependencies that
   were installed and prevent accidental regressions.

Commit the `package.json` and `yarn.lock` files.

Do not commit the `node_modules` directory: add the `node_modules/` rule to your `.gitignore` file.

You now have to update your `package.json` file to expose the `etwin` command.
Add the entry `"etwin": "etwin"` to the `scripts` config in your `package.json`.
The resulting `package.json` should be similar to:

```json
{
  "name": "myproject",
  "version": "0.0.1",
  "licenses": [
    {
      "type": "AGPL-3.0-or-later",
      "url": "https://spdx.org/licenses/AGPL-3.0-or-later.html"
    }
  ],
  "private": true,
  "scripts": {
    "etwin": "etwin"
  },
  "dependencies": {},
  "devDependencies": {
    "@eternal-twin/cli": "^0.9.2"
  }
}
```

**⚠ The package was previously named `@eternal-twin/website`, it was renamed to `@eternal-twin/cli`.**
Make sure you use the right package.

## Configure Eternaltwin

Before you can run Eternaltwin, you must configure it.

ℹ There is [an open issue](https://gitlab.com/eternal-twin/etwin/-/issues/20) to
  allow Eternaltwin to run without any configuration file.

The Eternaltwin configuration is loaded from a file named `etwin.toml`.

This file may contain configuration specific to your local machine and as such
should not be stored in Git. The recommended strategy to configure Eternaltwin
is the following:

1. Create a file named `etwin.toml.example`.
2. Copy [the official example configuration](https://gitlab.com/eternal-twin/etwin/-/blob/master/etwin.toml.example)
   ([raw](https://gitlab.com/eternal-twin/etwin/-/raw/master/etwin.toml.example))
   into `etwin.toml.example`. You do not need to customize the config yet.
3. Add the `etwin.toml` rule to your `.gitignore`, commit the file `etwin.toml.example`
4. Update your project setup documentation: contributors should copy the file `etwin.toml.example`
   into `etwin.toml` manually.
5. Copy your `etwin.toml.example` file into `etwin.toml`.

## Start Eternaltwin

Once Eternaltwin is installed and configured, you can run it from anywhere
inside your repo using the following command:

```
yarn etwin
```

This command starts the local Eternaltwin server on your computer. You can
use this server to test your project.

When starting, the server displays the configuration it is using. You can use
this information to troubleshoot your configuration.

By default, the server uses the port `50320` and is available at the address
<http://localhost:50320/>.

## Other commands

`yarn etwin` provides a couple subcommands:

- `yarn etwin start`: Start the dev version of the website (default command, that's why `yarn etwin` also starts the website)
- `yarn etwin db check`: Check the state of the Postgres database used by the dev website if configured to use the `postgres` mode
- `yarn etwin db create`: Initialize an empty database
- `yarn etwin db upgrade`: Upgrade an existing database to the latest schema version

## Next steps

Now that your repo is configured to run Eternaltwin, you may start to actually
integrate your project with Eternaltwin. The first step would be to [use
Eternaltwin to manage user accounts through OAuth](./etwin-oauth.md).
