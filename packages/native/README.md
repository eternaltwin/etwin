# etwin-native

Native module for Eternal-Twin.

Requires Cargo and Rust. Prebuilt binaries may be provided but are not guaranteed.

Uses [Node-API][napi] v6 (Node 14.0+)

## Cross-compiling prebuilt binaries

Cross-compiling is only officially support from Linux.

Dependencies: Wine, 7z, wget, <https://aur.archlinux.org/packages/msitools/>, clang, lld

Add [the targets](https://doc.rust-lang.org/nightly/rustc/platform-support.html):

```
rustup target add x86_64-pc-windows-msvc
rustup target add x86_64-apple-darwin
rustup target add x86_64-unknown-linux-gnu
```

<https://github.com/briansmith/ring/blob/main/BUILDING.md#cross-compiling>


<https://github.com/roblabla/msvc-wine>

```
git clone ...
cd /opt/wine/msvc-wine
python3 -m venv .
source bin/activate
python -m pip install simplejson six
python ./vsdownload.py --dest /opt/msvc
# Leve virtualenv
./install.sh /opt/msvc
```

Then edit `~/.cargo/config.toml` and set it to:

```
[target.x86_64-pc-windows-msvc]
linker = "/opt/msvc/bin/x64/lld-link"
```

And update your `.profile` to add:

```
export CC_x86_64_pc_windows_msvc=/opt/msvc/bin/x64/clang-cl
export AR_x86_64_pc_windows_msvc=llvm-lib
export RC_x86_64_pc_windows_msvc=llvm-rc
```

Now compile with:

```
cargo build --manifest-path ./native/Cargo.toml --lib --release --target x86_64-pc-windows-msvc
```

[napi]: https://nodejs.org/api/n-api.html
