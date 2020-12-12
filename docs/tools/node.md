[Home](../index.md) | [Tools](./index.md)

# Node.js

[Official website](https://nodejs.org/en/) | [GitHub](https://github.com/nodejs/node)

> **Node.js** is an open-source, cross-platform, back-end, JavaScript runtime
> environment that executes JavaScript code outside a web browser.

Eternal-Twin uses **Node.js** for its website and various command-line tools.

## Intallation

**⚠** Most projects require the version `14.13.1` or above.

### Linux or Mac

1. [Install `nvm`](https://github.com/nvm-sh/nvm#install--update-script).
2. Run `nvm install node`.

Check your installation with `node --version`.


**⚠** Most Linux distributions provide a `nodejs` or `node` package. This is a
system-level package intended as a dependency for other software. It is
recommended to avoid using this version: it requires `sudo` to install
global packages using `npm` and may be an older version that does not support
some projects.

### Windows

[Download the Windows installer](https://nodejs.org/en/download/) and execute it.

Check your installation with `node --version`.
