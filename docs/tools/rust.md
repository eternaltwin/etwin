[Home](../index.md) | [Tools](./index.md)

# Rust

[Official website](https://www.rust-lang.org/) | [GitHub](https://github.com/rust-lang/rust)

> A language empowering everyone to build reliable and efficient software.

Rust is the main language used by Eternaltwin. We use it for everything except
the frontend (which is in TypeScript): clients to official server, database
management, backend services, REST server, even project management.

## Intallation

**⚠** Etermaltwin relies on the **latest stable** Rust version.

It is recommended to follow [the official installation guidelines](https://www.rust-lang.org/tools/install)
and use the `rustup` tool to install Rust (even if your system provides it in
its package manager).

1. **Windows-only prerequisite**: If you use Windows, first make sure you have the
   [Visual Studio Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/).
   Only the two following components are required:
   - MSVC v142 - VS 2019 C++ x64/x86 build tools
   - Windows 10 SDK (1.0.18362.0)
2. Follow the instructions on [rustup.rs](https://rustup.rs/).

## Check your installation

```
$ rustup --version
rustup 1.24.3 (2021-06-08)
info: This is the version for the rustup toolchain manager, not the rustc compiler.
info: The currently active `rustc` version is `rustc 1.54.0 (a178d0322 2021-07-26)`
```
