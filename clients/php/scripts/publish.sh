#!/usr/bin/env oil
var PROJECT_ROOT = "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd $PROJECT_ROOT {
  var TEMP_DIR = "$(mktemp -d)"
  var NEW_VERSION = "$(jq --raw-output ".version" composer.json)"
  git clone git@gitlab.com:eternaltwin/etwin-php.git "${TEMP_DIR}"
  find "${TEMP_DIR}" -mindepth 1 -not -path "${TEMP_DIR}/.git" -not -path "${TEMP_DIR}/.git/*" -delete
  cp -R composer.json "${TEMP_DIR}/composer.json"
  cp -R "src/" "${TEMP_DIR}/src/"
  cd $TEMP_DIR {
    pwd
    git add .
    git commit -m "Release v${NEW_VERSION}"
    git tag -a "v${NEW_VERSION}" -m  "Release v${NEW_VERSION}"
    git push --tags origin master
  }
  rm -rf $TEMP_DIR
}
