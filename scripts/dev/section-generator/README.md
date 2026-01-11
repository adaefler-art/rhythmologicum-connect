# Section Generator CLI

## Overview

CLI tool for generating report sections from risk bundles and priority rankings in a deterministic, testable way.

## Usage

```bash
node scripts/dev/section-generator/generate.js \
  --bundle <path-to-risk-bundle.json> \
  --out <output-path.json> \
  [--ranking <path-to-ranking.json>] \
  [--method <template|llm|hybrid>] \
  [--sections <comma-separated-section-keys>] \
  [--allowlist [path-to-allowlist.json]]
```

## Arguments

### Required

- `--bundle <path>` - Path to input risk bundle JSON file
- `--out <path>` - Path to output sections JSON file

### Optional

- `--ranking <path>` - Path to input priority ranking JSON file
- `--method <method>` - Generation method (default: `template`)
  - `template` - Template-based generation
  - `llm` - LLM-based generation (with fallback)
  - `hybrid` - Hybrid approach
- `--sections <keys>` - Comma-separated section keys to generate (default: all applicable)
  - Available: `overview`, `risk-summary`, `recommendations`, `top-interventions`
- `--timestamp <iso-string>` - Fixed timestamp for deterministic output (default: current time)
  - Example: `2026-01-11T12:00:00.000Z`
  - Useful for testing and reproducible builds
- `--allowlist [path]` - Enable allowlist mode
  - Without value: Creates/uses `<outDir>/generator-allowlist.json`
  - With value: Uses specified path

## Examples

### Basic Usage

```bash
# Generate sections from risk bundle only
node scripts/dev/section-generator/generate.js \
  --bundle fixtures/risk-bundle.json \
  --out output/sections.json
```

### With Ranking

```bash
# Generate sections with ranking data for recommendations
node scripts/dev/section-generator/generate.js \
  --bundle fixtures/risk-bundle.json \
  --ranking fixtures/ranking.json \
  --out output/sections.json
```

### Specific Sections

```bash
# Generate only overview and risk-summary sections
node scripts/dev/section-generator/generate.js \
  --bundle fixtures/risk-bundle.json \
  --out output/sections.json \
  --sections overview,risk-summary
```

### Deterministic Output

```bash
# Generate with fixed timestamp for reproducible output
node scripts/dev/section-generator/generate.js \
  --bundle fixtures/risk-bundle.json \
  --out output/sections.json \
  --timestamp "2026-01-11T12:00:00.000Z"
```

### With Allowlist

```bash
# Enable allowlist with default path
node scripts/dev/section-generator/generate.js \
  --bundle fixtures/risk-bundle.json \
  --out output/sections.json \
  --allowlist

# Enable allowlist with custom path
node scripts/dev/section-generator/generate.js \
  --bundle fixtures/risk-bundle.json \
  --out output/sections.json \
  --allowlist custom-allowlist.json
```

## Allowlist Format

The allowlist JSON file has the following structure:

```json
{
  "allowedSections": [
    "overview",
    "risk-summary"
  ]
}
```

Currently, the allowlist is loaded but not actively used for filtering. This infrastructure is in place for future enhancement.

## Output Format

The CLI generates a JSON file containing:

```json
{
  "sectionsVersion": "v1",
  "jobId": "...",
  "riskBundleId": "...",
  "rankingId": "...",
  "programTier": "...",
  "sections": [
    {
      "sectionKey": "overview",
      "inputs": { ... },
      "draft": "...",
      "promptVersion": "v1.0.0",
      "modelConfig": null,
      "generationMethod": "template",
      "generatedAt": "2026-01-11T..."
    }
  ],
  "generatedAt": "2026-01-11T...",
  "metadata": {
    "generationTimeMs": 0,
    "llmCallCount": 0,
    "fallbackCount": 0
  }
}
```

## Testing

The CLI has comprehensive Jest integration tests covering:

- **Allowlist flag scenarios**
  - Default path creation
  - Explicit path specification
  - Disabled mode
  - Edge cases (end of args, followed by another flag)
  - Stub file creation

- **Determinism tests**
  - Identical inputs produce identical outputs
  - Deterministic factor ordering (sorted by score desc, key asc)
  - Deterministic intervention ordering (sorted by priority desc, topicId asc)

- **Error handling**
  - Missing required arguments
  - Invalid input files

Run tests:

```bash
npm test -- scripts/dev/section-generator/__tests__/generate.cli.test.ts
```

## Determinism Guarantees

The generator ensures deterministic output by:

1. **Sorting factors** by score (descending), then key (ascending) for tie-breaking
2. **Sorting interventions** by priority score (descending), then topicId (ascending) for tie-breaking
3. **Fixed timestamps** via `--timestamp` flag for reproducible builds
4. **Stable jobId** defaults to `"cli-generated"` instead of time-based value
5. **Stable JSON serialization** with consistent formatting

When using `--timestamp`, the same input always produces **byte-for-byte identical output**, making the tool suitable for:
- Regression testing
- CI/CD pipelines
- Snapshot comparisons
- Cache validation
- Deterministic builds

## Development

### Test Fixtures

Test fixtures are located in `__tests__/fixtures/`:
- `risk-bundle.json` - Sample risk bundle with factors
- `ranking.json` - Sample priority ranking with interventions

### Adding New Tests

Follow the pattern in `generate.cli.test.ts`:

1. Create temp output directory
2. Run generator with specific args
3. Verify output exists and has expected structure
4. Clean up (Jest handles temp file cleanup)

## Related Files

- `lib/sections/generator.ts` - Core generator implementation
- `lib/sections/__tests__/generator.test.ts` - Unit tests for generator
- `scripts/dev/endpoint-catalog/generate.js` - Similar CLI pattern for endpoint catalog
