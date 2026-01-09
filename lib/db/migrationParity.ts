export const IDENTIFIER_COLUMN_PRIORITY = [
  'filename',
  'migration_id',
  'name',
  'migration_name',
  'version',
  'id',
] as const

export type SupportedIdentifierColumn = (typeof IDENTIFIER_COLUMN_PRIORITY)[number]

export type RepoMigration = {
  filename: string
  basename: string
  canonicalId: string
}

export type DbMigration = {
  raw: string
  canonicalId: string
}

export type MigrationParityReport = {
  identifierColumn: string
  supportedIdentifierColumns: readonly SupportedIdentifierColumn[]
  detectedColumns: string[]
  repo: {
    count: number
    migrations: RepoMigration[]
  }
  db: {
    count: number
    migrations: DbMigration[]
  }
  parity: {
    repoOnly: string[]
    dbOnly: string[]
    shared: string[]
  }
}

export type UnsupportedSchemaMigrationsError = {
  message: string
  detectedColumns: string[]
  supportedIdentifierColumns: readonly SupportedIdentifierColumn[]
}

function normalizeColumnName(value: string): string {
  return value.trim().toLowerCase()
}

export function pickIdentifierColumn(
  detectedColumns: string[],
): { column: string | null; detectedColumnsNormalized: string[] } {
  const detectedColumnsNormalized = detectedColumns
    .map(normalizeColumnName)
    .filter((c) => c.length > 0)

  const normalizedToOriginal = new Map<string, string>()
  detectedColumns.forEach((original) => {
    const normalized = normalizeColumnName(original)
    if (!normalizedToOriginal.has(normalized)) {
      normalizedToOriginal.set(normalized, original)
    }
  })

  for (const candidate of IDENTIFIER_COLUMN_PRIORITY) {
    if (detectedColumnsNormalized.includes(candidate)) {
      return {
        column: normalizedToOriginal.get(candidate) ?? candidate,
        detectedColumnsNormalized,
      }
    }
  }

  return { column: null, detectedColumnsNormalized }
}

function extractLeadingDigits(value: string): string | null {
  const match = value.trim().match(/^(\d+)/)
  return match?.[1] ?? null
}

export function canonicalizeRepoMigrationFilename(filename: string): RepoMigration {
  const justName = filename.split(/[/\\]/).pop() ?? filename
  const basename = justName.replace(/\.[^.]+$/, '')

  const numericPrefix = extractLeadingDigits(basename)
  const canonicalId = numericPrefix ?? basename

  return {
    filename: justName,
    basename,
    canonicalId,
  }
}

export function canonicalizeDbMigrationIdentifier(value: unknown): DbMigration | null {
  if (value === null || value === undefined) return null

  const raw = String(value).trim()
  if (!raw) return null

  const leadingDigits = extractLeadingDigits(raw)
  const canonicalId = leadingDigits ?? raw

  return { raw, canonicalId }
}

function compareCanonicalIds(a: string, b: string): number {
  const aIsDigits = /^\d+$/.test(a)
  const bIsDigits = /^\d+$/.test(b)

  if (aIsDigits && bIsDigits) {
    const aBig = BigInt(a)
    const bBig = BigInt(b)
    if (aBig < bBig) return -1
    if (aBig > bBig) return 1
    return 0
  }

  if (aIsDigits !== bIsDigits) return aIsDigits ? -1 : 1

  return a.localeCompare(b, 'en', { sensitivity: 'base' })
}

export function buildMigrationParityReport(params: {
  identifierColumn: string
  detectedColumns: string[]
  repoMigrationFilenames: string[]
  dbIdentifierValues: unknown[]
}): MigrationParityReport {
  const repoMigrations = params.repoMigrationFilenames
    .map(canonicalizeRepoMigrationFilename)
    .sort((a, b) => compareCanonicalIds(a.canonicalId, b.canonicalId) || a.filename.localeCompare(b.filename))

  const dbMigrations = params.dbIdentifierValues
    .map(canonicalizeDbMigrationIdentifier)
    .filter((m): m is DbMigration => Boolean(m))
    .sort((a, b) => compareCanonicalIds(a.canonicalId, b.canonicalId) || a.raw.localeCompare(b.raw))

  const repoIds = new Set(repoMigrations.map((m) => m.canonicalId))
  const dbIds = new Set(dbMigrations.map((m) => m.canonicalId))

  const repoOnly = [...repoIds].filter((id) => !dbIds.has(id)).sort(compareCanonicalIds)
  const dbOnly = [...dbIds].filter((id) => !repoIds.has(id)).sort(compareCanonicalIds)
  const shared = [...repoIds].filter((id) => dbIds.has(id)).sort(compareCanonicalIds)

  return {
    identifierColumn: params.identifierColumn,
    supportedIdentifierColumns: IDENTIFIER_COLUMN_PRIORITY,
    detectedColumns: [...params.detectedColumns].sort((a, b) => a.localeCompare(b)),
    repo: {
      count: repoMigrations.length,
      migrations: repoMigrations,
    },
    db: {
      count: dbMigrations.length,
      migrations: dbMigrations,
    },
    parity: {
      repoOnly,
      dbOnly,
      shared,
    },
  }
}

export function validateSchemaMigrationsColumns(
  detectedColumns: string[],
): { ok: true; identifierColumn: string } | { ok: false; error: UnsupportedSchemaMigrationsError } {
  const { column } = pickIdentifierColumn(detectedColumns)

  if (!column) {
    return {
      ok: false,
      error: {
        message:
          'schema_migrations exists but has no supported identifier column. Supported columns: ' +
          IDENTIFIER_COLUMN_PRIORITY.join(', '),
        detectedColumns: [...detectedColumns].sort((a, b) => a.localeCompare(b)),
        supportedIdentifierColumns: IDENTIFIER_COLUMN_PRIORITY,
      },
    }
  }

  return { ok: true, identifierColumn: column }
}
