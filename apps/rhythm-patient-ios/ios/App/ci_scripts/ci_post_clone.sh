#!/bin/bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

ensure_npm() {
	if command -v npm >/dev/null 2>&1; then
		return 0
	fi

	NODE_VERSION="${NODE_VERSION:-20.17.0}"
	ARCH_RAW="$(uname -m)"
	case "${ARCH_RAW}" in
		arm64) NODE_ARCH="arm64" ;;
		x86_64) NODE_ARCH="x64" ;;
		*) NODE_ARCH="x64" ;;
	esac

	NODE_DIST="node-v${NODE_VERSION}-darwin-${NODE_ARCH}"
	NODE_HOME="${HOME}/.local/${NODE_DIST}"

	if [[ ! -x "${NODE_HOME}/bin/npm" ]]; then
		echo "[ci_post_clone][app-local] npm not found; installing Node ${NODE_VERSION} (${NODE_ARCH})"
		rm -rf "/tmp/${NODE_DIST}" "/tmp/${NODE_DIST}.tar.gz"
		curl -fsSL "https://nodejs.org/dist/v${NODE_VERSION}/${NODE_DIST}.tar.gz" -o "/tmp/${NODE_DIST}.tar.gz"
		tar -xzf "/tmp/${NODE_DIST}.tar.gz" -C /tmp
		mkdir -p "${HOME}/.local"
		rm -rf "${NODE_HOME}"
		mv "/tmp/${NODE_DIST}" "${NODE_HOME}"
	fi

	export PATH="${NODE_HOME}/bin:${PATH}"
}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ -n "${CI_WORKSPACE:-}" && -d "${CI_WORKSPACE}" ]]; then
	REPO_ROOT="${CI_WORKSPACE}"
else
	REPO_ROOT="$(cd "$SCRIPT_DIR/../../../../.." && pwd)"
fi

echo "[ci_post_clone][app-local] PWD=$(pwd)"
echo "[ci_post_clone][app-local] REPO_ROOT=${REPO_ROOT}"
cd "${REPO_ROOT}"

ensure_npm

if ! command -v npm >/dev/null 2>&1; then
	echo "[ci_post_clone][app-local] ERROR: npm still not found after bootstrap. PATH=${PATH}"
	exit 1
fi

echo "[ci_post_clone][app-local] npm=$(command -v npm)"
npm ci --workspaces --include-workspace-root --include=dev || npm ci

if [[ ! -d "node_modules/@capacitor/ios" ]]; then
	echo "[ci_post_clone][app-local] ERROR: node_modules/@capacitor/ios missing after npm install"
	exit 1
fi

if ! command -v pod >/dev/null 2>&1; then
	echo "[ci_post_clone][app-local] ERROR: pod not found in PATH=${PATH}"
	exit 1
fi

cd apps/rhythm-patient-ios/ios/App
pod install
echo "[ci_post_clone][app-local] Done"
