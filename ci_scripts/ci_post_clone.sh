#!/bin/sh
set -euo pipefail

REPO_ROOT="${CI_WORKSPACE:-$(git rev-parse --show-toplevel)}"

echo "[ci_post_clone] Using repo root: ${REPO_ROOT}"
cd "${REPO_ROOT}"

echo "[ci_post_clone] Installing npm dependencies"
npm ci --workspaces --include-workspace-root --include=dev

if [ ! -d "node_modules/@capacitor/ios" ]; then
	echo "[ci_post_clone] ERROR: node_modules/@capacitor/ios not found after npm ci"
	exit 1
fi

echo "[ci_post_clone] Installing CocoaPods dependencies"
cd apps/rhythm-patient-ios/ios/App
pod install

echo "[ci_post_clone] Done"
