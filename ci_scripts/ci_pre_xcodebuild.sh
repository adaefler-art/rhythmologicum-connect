#!/bin/sh
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

REPO_ROOT="${CI_WORKSPACE:-$(pwd)}"

echo "[ci_pre_xcodebuild] Using repo root: ${REPO_ROOT}"
cd "${REPO_ROOT}"

echo "[ci_pre_xcodebuild] Installing npm dependencies"
npm ci --workspaces --include-workspace-root --include=dev

if [ ! -d "node_modules/@capacitor/ios" ]; then
	echo "[ci_pre_xcodebuild] ERROR: node_modules/@capacitor/ios not found after npm ci"
	exit 1
fi

echo "[ci_pre_xcodebuild] Installing CocoaPods dependencies"
cd apps/rhythm-patient-ios/ios/App
pod install

echo "[ci_pre_xcodebuild] Done"
