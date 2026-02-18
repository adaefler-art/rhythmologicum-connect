#!/bin/sh
set -euo pipefail

REPO_ROOT="${CI_WORKSPACE:-$(pwd)}"

echo "[ci_post_clone] Using repo root: ${REPO_ROOT}"
cd "${REPO_ROOT}"

echo "[ci_post_clone] Installing npm dependencies"
npm ci

echo "[ci_post_clone] Installing CocoaPods dependencies"
cd apps/rhythm-patient-ios/ios/App
pod install

echo "[ci_post_clone] Done"
