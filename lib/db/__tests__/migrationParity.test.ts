import {
  IDENTIFIER_COLUMN_PRIORITY,
  buildMigrationParityReport,
  canonicalizeDbMigrationIdentifier,
  canonicalizeRepoMigrationFilename,
  pickIdentifierColumn,
  validateSchemaMigrationsColumns,
} from '@/lib/db/migrationParity'

describe('migrationParity adapter', () => {
  describe('pickIdentifierColumn', () => {
    it('prefers filename over others', () => {
      const { column } = pickIdentifierColumn(['id', 'filename', 'version'])
      expect(column).toBe('filename')
    })

    it('supports migration_id', () => {
      const { column } = pickIdentifierColumn(['migration_id', 'inserted_at'])
      expect(column).toBe('migration_id')
    })

    it('supports version', () => {
      const { column } = pickIdentifierColumn(['version'])
      expect(column).toBe('version')
    })

    it('supports migration_name', () => {
      const { column } = pickIdentifierColumn(['migration_name', 'applied_at'])
      expect(column).toBe('migration_name')
    })
  })

  describe('canonicalization', () => {
    it('repo canonicalId uses leading digits when present', () => {
      expect(canonicalizeRepoMigrationFilename('054_add_table.sql').canonicalId).toBe('054')
      expect(
        canonicalizeRepoMigrationFilename('20251231093345_v05_i01_3_versioning_contract.sql').canonicalId,
      ).toBe('20251231093345')
    })

    it('repo canonicalId uses full basename when no leading digits', () => {
      expect(canonicalizeRepoMigrationFilename('init.sql').canonicalId).toBe('init')
      expect(canonicalizeRepoMigrationFilename('abc_123.sql').canonicalId).toBe('abc_123')
    })

    it('db canonicalId extracts leading digits for numeric-like strings', () => {
      expect(canonicalizeDbMigrationIdentifier('20251231093345_v05_i01_3').canonicalId).toBe(
        '20251231093345',
      )
      expect(canonicalizeDbMigrationIdentifier('054').canonicalId).toBe('054')
      expect(canonicalizeDbMigrationIdentifier(54)?.canonicalId).toBe('54')
    })

    it('db canonicalId keeps non-numeric strings as-is', () => {
      expect(canonicalizeDbMigrationIdentifier('init')?.canonicalId).toBe('init')
      expect(canonicalizeDbMigrationIdentifier('v1_init')?.canonicalId).toBe('v1_init')
    })
  })

  describe('validateSchemaMigrationsColumns', () => {
    it('returns 400-style diagnostics when unsupported schema', () => {
      const result = validateSchemaMigrationsColumns(['applied_at', 'checksum'])
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.detectedColumns).toEqual(['applied_at', 'checksum'])
        expect(result.error.supportedIdentifierColumns).toEqual(IDENTIFIER_COLUMN_PRIORITY)
        expect(result.error.message).toContain('Supported columns')
      }
    })
  })

  describe('buildMigrationParityReport', () => {
    it('produces deterministic ordering (snapshot)', () => {
      const report = buildMigrationParityReport({
        identifierColumn: 'version',
        detectedColumns: ['version', 'name'],
        repoMigrationFilenames: [
          '20251231093345_v05_i01_3_versioning_contract.sql',
          '054_add_table.sql',
          'init.sql',
        ],
        dbIdentifierValues: ['init', '20251231093345', '999']
      })

      expect(report).toMatchSnapshot()
    })
  })
})
