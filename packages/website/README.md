# Eternal-Twin Web Application

This package contains the Eternal-Twin Web Application. It uses the [Angular][angular] framework.

The application supports internationalization and both client-side and server-side rendering.

## Overview

### Sources

All the source files are in the `./src/` directory. This is the only directory you should edit manually.

The directory `./src/main/` contains the top-level server code. It is compiled as native ESM to `./main` using Typescript. All the other directories in `./src/` are handled by Angular's CLI and bundled using webpack and compiled to `./app/`. **Relative imports in `./src/main/` must use the `.js` extension, relative imports in the other directories must be extensionless**.

When there are pairs of files with the `.server.ts` and `.browser.ts` suffixes, it indicates that they both have the same role but one is used for server-side rendering and the other in the browser.

- `./src/app/`: main Angular application directory. It contains Angular components and their logic (including routing).
- `./src/modules`: Angular modules, with services (for example, this is where code interacting with the API is located).
- `./src/assets`: Static assets.
- `./src/browser`: Client-side rendering entry point.
- `./src/server`: Server-side rendering entry point.
- `./src/environments`: Environment configuration files for the web-app.
- `./src/locales`: Translation files.
- `./src/styles`: SCSS style files.
- `./src/main`: Top-level server.

### Build artifacts

- `./app/browser/` contains static files. On the production server they are gzip-compressed and directly served by nginx.
- `./app/server/` contains server-side rendering files: a `main.js` and `index.html` for each locale.
- `./main/` contains the top-level server. It handles routing for the API and the app routes. 

## Actions

Most project-level actions are defined as `yarn` commands, in the `scripts` field of `package.json`.

Here are the main actions:

- `yarn run app:serve:browser`: Serve the browser-side rendering code, with live-reloading.
- `yarn run app:serve:server`: Serve the browser-side and server-side rendering code, with live-reloading.
- `yarn run start` (or simply `yarn start`): Do a full production build, then run the top-level server.
- `yarn run app:prod:build:optimize`: Optimize the static assets (not fully crossplatform: requires the `gzip` CLI).
- `yarn run app:xi18n`: Import source-code changes into the translation files (e.g. when new messages are added).

[angular]: https://angular.io/
