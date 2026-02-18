#!/bin/bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ -n "${CI_WORKSPACE:-}" && -d "${CI_WORKSPACE}" ]]; then
	REPO_ROOT="${CI_WORKSPACE}"
else
	REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
fi

echo "[ci_pre_xcodebuild][app-local] REPO_ROOT=${REPO_ROOT}"
cd "${REPO_ROOT}"

if ! command -v npm >/dev/null 2>&1; then
	echo "[ci_pre_xcodebuild][app-local] ERROR: npm not found in PATH=${PATH}"
	exit 1
fi

npm ci --workspaces --include-workspace-root --include=dev || npm ci

if [[ ! -d "node_modules/@capacitor/ios" ]]; then
	echo "[ci_pre_xcodebuild][app-local] ERROR: node_modules/@capacitor/ios missing after npm install"
	exit 1
fi

if ! command -v pod >/dev/null 2>&1; then
	echo "[ci_pre_xcodebuild][app-local] ERROR: pod not found in PATH=${PATH}"
	exit 1
fi

cd apps/rhythm-patient-ios/ios/App
pod install
echo "[ci_pre_xcodebuild][app-local] Done"
