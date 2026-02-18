#!/bin/sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="${CI_WORKSPACE:-$(cd "$SCRIPT_DIR/../../../../.." && pwd)}"
sh "${REPO_ROOT}/ci_scripts/ci_pre_xcodebuild.sh"
