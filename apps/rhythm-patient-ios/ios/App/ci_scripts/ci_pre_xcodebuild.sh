#!/bin/sh
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
"${REPO_ROOT}/ci_scripts/ci_pre_xcodebuild.sh"
