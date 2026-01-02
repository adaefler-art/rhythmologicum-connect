#!/bin/bash

# TV05-CLEANUP & AUDIT - Repo Cleanup Audit Script
# Version: 1.0.0
# Description: Performs deterministic cleanup audit of the repository

set -euo pipefail

# Configuration
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${REPO_ROOT}/docs"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

echo "=============================================================================="
echo "  Rhythmologicum Connect - Cleanup Audit Script"
echo "  Version: 1.0.0"
echo "=============================================================================="
echo ""
echo "Repository Root: ${REPO_ROOT}"
echo "Output Directory: ${OUTPUT_DIR}"
echo "Timestamp: ${TIMESTAMP}"
echo ""

# Temporary files for data collection
TMP_DIR="/tmp/cleanup-audit-$$"
mkdir -p "${TMP_DIR}"

API_ROUTES_FILE="${TMP_DIR}/api_routes.txt"
PAGE_ROUTES_FILE="${TMP_DIR}/page_routes.txt"
SERVER_ACTIONS_FILE="${TMP_DIR}/server_actions.txt"
V05_ISSUES_FILE="${TMP_DIR}/v05_issues.txt"

# Cleanup on exit
trap "rm -rf ${TMP_DIR}" EXIT

# =============================================================================
# Helper Functions
# =============================================================================

section_header() {
    echo ""
    echo "─────────────────────────────────────────────────────────────────────────────"
    echo "  $1"
    echo "─────────────────────────────────────────────────────────────────────────────"
    echo ""
}

search_usage() {
    local pattern="$1"
    local search_path="${2:-.}"
    
    cd "${REPO_ROOT}"
    grep -r "$pattern" \
        --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
        --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=__tests__ \
        --exclude="*.test.*" --exclude-dir=dist --exclude-dir=build \
        "${search_path}" 2>/dev/null | wc -l || echo "0"
}

# =============================================================================
# Phase 1: Analyze API Routes
# =============================================================================

section_header "Phase 1: Analyzing API Routes"

cd "${REPO_ROOT}"
find app/api -name "route.ts" -type f 2>/dev/null | while read -r route_file; do
    # Convert file path to URL path
    route_path=$(echo "$route_file" | sed 's|app/api||' | sed 's|/route\.ts||')
    route_url="/api${route_path}"
    
    # Extract HTTP methods
    methods=$(grep -Eo 'export (async )?function (GET|POST|PUT|PATCH|DELETE)' "$route_file" 2>/dev/null | \
        sed 's/export.*function //' | tr '\n' ',' | sed 's/,$//')
    
    # Search for usage (exclude API directory and tests)
    usage_count=$(search_usage "$route_url" "app lib" | tr -d ' ')
    
    # Determine status
    if [ "$usage_count" -eq 0 ]; then
        status="UNUSED"
    elif [ "$usage_count" -le 2 ]; then
        status="LOW_USAGE"
    else
        status="IN_USE"
    fi
    
    echo "${route_url}|${route_file}|${methods}|${usage_count}|${status}" >> "${API_ROUTES_FILE}"
done

total_apis=$(wc -l < "${API_ROUTES_FILE}" 2>/dev/null || echo "0")
unused_apis=$(grep -c "UNUSED$" "${API_ROUTES_FILE}" 2>/dev/null || echo "0")
low_usage_apis=$(grep -c "LOW_USAGE$" "${API_ROUTES_FILE}" 2>/dev/null || echo "0")
in_use_apis=$(grep -c "IN_USE$" "${API_ROUTES_FILE}" 2>/dev/null || echo "0")

echo "Found ${total_apis} API routes"
echo "  → ${unused_apis} potentially unused"
echo "  → ${low_usage_apis} with low usage"
echo "  → ${in_use_apis} actively used"

# =============================================================================
# Phase 2: Analyze Page Routes
# =============================================================================

section_header "Phase 2: Analyzing Page Routes"

find app -name "page.tsx" -type f 2>/dev/null | while read -r page_file; do
    # Convert file path to URL path
    route_path=$(echo "$page_file" | sed 's|app||' | sed 's|/page\.tsx||')
    
    # Search for href and navigation references (handle dynamic routes)
    search_pattern=$(echo "$route_path" | sed 's|\[.*\]|.*|g')
    href_count=$(search_usage "href.*${search_pattern}" "app lib" | tr -d ' ')
    nav_count=$(search_usage "push.*${search_pattern}\|navigate.*${search_pattern}" "app lib" | tr -d ' ')
    
    total_usage=$((href_count + nav_count))
    
    # Determine status
    if [ "$total_usage" -eq 0 ]; then
        status="UNREACHABLE"
    elif [ "$total_usage" -le 2 ]; then
        status="LOW_TRAFFIC"
    else
        status="ACTIVE"
    fi
    
    echo "${route_path}|${page_file}|${href_count}|${nav_count}|${total_usage}|${status}" >> "${PAGE_ROUTES_FILE}"
done

total_pages=$(wc -l < "${PAGE_ROUTES_FILE}" 2>/dev/null || echo "0")
unreachable_pages=$(grep -c "UNREACHABLE$" "${PAGE_ROUTES_FILE}" 2>/dev/null || echo "0")
low_traffic_pages=$(grep -c "LOW_TRAFFIC$" "${PAGE_ROUTES_FILE}" 2>/dev/null || echo "0")
active_pages=$(grep -c "ACTIVE$" "${PAGE_ROUTES_FILE}" 2>/dev/null || echo "0")

echo "Found ${total_pages} page routes"
echo "  → ${unreachable_pages} potentially unreachable"
echo "  → ${low_traffic_pages} with low traffic"
echo "  → ${active_pages} actively linked"

# =============================================================================
# Phase 3: Analyze Server Actions
# =============================================================================

section_header "Phase 3: Analyzing Server Actions"

find lib/actions -name "*.ts" -type f ! -name "*.test.*" 2>/dev/null | while read -r action_file; do
    # Extract exported function names
    grep -E 'export (async )?function \w+' "$action_file" 2>/dev/null | \
        sed -E 's/export (async )?function ([a-zA-Z0-9_]+).*/\2/' | \
        while read -r function_name; do
            # Search for usage
            usage_count=$(search_usage "\\b${function_name}\\b" "." | tr -d ' ')
            
            # Determine status (subtract 1 for the definition itself)
            if [ "$usage_count" -le 1 ]; then
                status="UNUSED"
            elif [ "$usage_count" -le 3 ]; then
                status="LOW_USAGE"
            else
                status="IN_USE"
            fi
            
            echo "${function_name}|${action_file}|${usage_count}|${status}" >> "${SERVER_ACTIONS_FILE}"
        done
done

total_actions=$(wc -l < "${SERVER_ACTIONS_FILE}" 2>/dev/null || echo "0")
unused_actions=$(grep -c "UNUSED$" "${SERVER_ACTIONS_FILE}" 2>/dev/null || echo "0")
low_usage_actions=$(grep -c "LOW_USAGE$" "${SERVER_ACTIONS_FILE}" 2>/dev/null || echo "0")
in_use_actions=$(grep -c "IN_USE$" "${SERVER_ACTIONS_FILE}" 2>/dev/null || echo "0")

echo "Found ${total_actions} server actions"
echo "  → ${unused_actions} potentially unused"
echo "  → ${low_usage_actions} with low usage"
echo "  → ${in_use_actions} actively used"

# =============================================================================
# Phase 4: Extract V05 Issues
# =============================================================================

section_header "Phase 4: Extracting V05 Issues"

# Extract unique issue IDs
grep -roh "V05-I[0-9][0-9]*\.[0-9]*" \
    --include="*.md" --include="*.sql" \
    --exclude-dir=node_modules --exclude-dir=.git \
    . 2>/dev/null | sort -u | while read -r issue_id; do
    
    # Find all files mentioning this issue
    files=$(grep -rl "$issue_id" \
        --include="*.md" --include="*.sql" \
        --exclude-dir=node_modules --exclude-dir=.git \
        . 2>/dev/null | wc -l)
    
    migrations=$(grep -rl "$issue_id" supabase/migrations 2>/dev/null | wc -l || echo "0")
    docs=$(grep -rl "$issue_id" docs --include="*.md" 2>/dev/null | wc -l || echo "0")
    
    # Determine status
    if [ "$migrations" -gt 0 ]; then
        status="IMPLEMENTED"
    elif [ "$docs" -gt 0 ]; then
        status="DOCUMENTED"
    else
        status="MENTIONED"
    fi
    
    echo "${issue_id}|${files}|${migrations}|${docs}|${status}" >> "${V05_ISSUES_FILE}"
done

total_issues=$(wc -l < "${V05_ISSUES_FILE}" 2>/dev/null || echo "0")
implemented_issues=$(grep -c "IMPLEMENTED$" "${V05_ISSUES_FILE}" 2>/dev/null || echo "0")
documented_issues=$(grep -c "DOCUMENTED$" "${V05_ISSUES_FILE}" 2>/dev/null || echo "0")
mentioned_issues=$(grep -c "MENTIONED$" "${V05_ISSUES_FILE}" 2>/dev/null || echo "0")

echo "Found ${total_issues} V05 issue references"
echo "  → ${implemented_issues} implemented (with migrations)"
echo "  → ${documented_issues} documented only"
echo "  → ${mentioned_issues} mentioned only"

# =============================================================================
# Phase 5: Generate Reports
# =============================================================================

section_header "Phase 5: Generating Reports"

# Ensure output directory exists
mkdir -p "${OUTPUT_DIR}"

echo "This script collected data successfully."
echo "Report generation will be done via PowerShell script for better formatting."
echo ""
echo "Data files created:"
echo "  - ${API_ROUTES_FILE}"
echo "  - ${PAGE_ROUTES_FILE}"
echo "  - ${SERVER_ACTIONS_FILE}"
echo "  - ${V05_ISSUES_FILE}"
echo ""
echo "Summary:"
echo "  • API Routes: ${unused_apis}/${total_apis} potentially unused"
echo "  • Page Routes: ${unreachable_pages}/${total_pages} potentially unreachable"
echo "  • Server Actions: ${unused_actions}/${total_actions} potentially unused"
echo "  • V05 Issues: ${total_issues} found, ${implemented_issues} implemented"
echo ""

# Copy data files to output directory for inspection
cp "${API_ROUTES_FILE}" "${OUTPUT_DIR}/cleanup_audit_api_routes.txt"
cp "${PAGE_ROUTES_FILE}" "${OUTPUT_DIR}/cleanup_audit_page_routes.txt"
cp "${SERVER_ACTIONS_FILE}" "${OUTPUT_DIR}/cleanup_audit_server_actions.txt"
cp "${V05_ISSUES_FILE}" "${OUTPUT_DIR}/cleanup_audit_v05_issues.txt"

echo "✓ Data files saved to ${OUTPUT_DIR}/"
echo ""
echo "=============================================================================="
echo "  Data Collection Complete!"
echo "=============================================================================="
echo ""
