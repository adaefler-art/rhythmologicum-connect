/**
 * Unit Tests for Extraction Pipeline (V05-I04.2)
 * 
 * Tests extraction helpers, schema validation, and input hashing
 */

import {
  computeExtractionInputHash,
  validateDocumentReadyForExtraction,
  checkExtractionExists,
} from '../pipeline'
import {
  ExtractedDataSchema,
  ConfidenceMetadataSchema,
  validateExtractedData,
  validateConfidenceMetadata,
  EXTRACTION_ERROR,
} from '@/lib/types/extraction'

// Mock Supabase client
const createMockSupabaseClient = (mockData: any) => {
  const mockChain = {
    single: async () => mockData,
    maybeSingle: async () => mockData,
    eq: () => mockChain,
  }

  return {
    from: (table: string) => ({
      select: () => mockChain,
    }),
  }
}

describe('Extraction Pipeline Helpers', () => {
  describe('computeExtractionInputHash', () => {
    it('should generate deterministic hash for same inputs', async () => {
      const params = {
        storagePath: 'user123/assessment456/doc.pdf',
        extractorVersion: 'v1.0.0',
        parsedText: 'Sample text',
      }

      const hash1 = await computeExtractionInputHash(params)
      const hash2 = await computeExtractionInputHash(params)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA-256 produces 64 hex characters
    })

    it('should generate different hash for different inputs', async () => {
      const params1 = {
        storagePath: 'user123/assessment456/doc1.pdf',
        extractorVersion: 'v1.0.0',
        parsedText: 'Sample text 1',
      }

      const params2 = {
        storagePath: 'user123/assessment456/doc2.pdf',
        extractorVersion: 'v1.0.0',
        parsedText: 'Sample text 2',
      }

      const hash1 = await computeExtractionInputHash(params1)
      const hash2 = await computeExtractionInputHash(params2)

      expect(hash1).not.toBe(hash2)
    })

    it('should handle missing parsedText', async () => {
      const params = {
        storagePath: 'user123/assessment456/doc.pdf',
        extractorVersion: 'v1.0.0',
      }

      const hash = await computeExtractionInputHash(params)

      expect(hash).toHaveLength(64)
    })

    it('should generate different hash when version changes', async () => {
      const baseParams = {
        storagePath: 'user123/assessment456/doc.pdf',
        parsedText: 'Sample text',
      }

      const hash1 = await computeExtractionInputHash({
        ...baseParams,
        extractorVersion: 'v1.0.0',
      })

      const hash2 = await computeExtractionInputHash({
        ...baseParams,
        extractorVersion: 'v1.1.0',
      })

      expect(hash1).not.toBe(hash2)
    })
  })

  describe('validateDocumentReadyForExtraction', () => {
    it('should accept document in completed parsing state', async () => {
      const mockSupabase = createMockSupabaseClient({
        data: {
          id: 'doc123',
          parsing_status: 'completed',
          storage_path: 'path/to/doc.pdf',
          doc_type: 'application/pdf',
        },
        error: null,
      })

      const result = await validateDocumentReadyForExtraction(
        mockSupabase as any,
        'doc123',
      )

      expect(result.valid).toBe(true)
      expect(result.document).toBeDefined()
    })

    it('should reject document in pending parsing state', async () => {
      const mockSupabase = createMockSupabaseClient({
        data: {
          id: 'doc123',
          parsing_status: 'pending',
          storage_path: 'path/to/doc.pdf',
        },
        error: null,
      })

      const result = await validateDocumentReadyForExtraction(
        mockSupabase as any,
        'doc123',
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('completed')
    })

    it('should reject document in processing parsing state', async () => {
      const mockSupabase = createMockSupabaseClient({
        data: {
          id: 'doc123',
          parsing_status: 'processing',
          storage_path: 'path/to/doc.pdf',
        },
        error: null,
      })

      const result = await validateDocumentReadyForExtraction(
        mockSupabase as any,
        'doc123',
      )

      expect(result.valid).toBe(false)
      expect(result.error).toContain('completed')
    })

    it('should reject document not found', async () => {
      const mockSupabase = createMockSupabaseClient({
        data: null,
        error: { message: 'Not found' },
      })

      const result = await validateDocumentReadyForExtraction(
        mockSupabase as any,
        'doc123',
      )

      expect(result.valid).toBe(false)
      expect(result.error).toBe('Document not found')
    })
  })

  describe('checkExtractionExists', () => {
    it('should return true when extraction exists', async () => {
      const mockSupabase = createMockSupabaseClient({
        data: {
          id: 'doc123',
          extractor_version: 'v1.0.0',
          input_hash: 'abc123',
          extracted_json: { lab_values: [] },
          confidence_json: { overall_confidence: 0.9 },
        },
        error: null,
      })

      const result = await checkExtractionExists(
        mockSupabase as any,
        'doc123',
        'v1.0.0',
        'abc123',
      )

      expect(result.exists).toBe(true)
      expect(result.extraction).toBeDefined()
    })

    it('should return false when extraction does not exist', async () => {
      const mockSupabase = createMockSupabaseClient({
        data: null,
        error: null,
      })

      const result = await checkExtractionExists(
        mockSupabase as any,
        'doc123',
        'v1.0.0',
        'abc123',
      )

      expect(result.exists).toBe(false)
    })

    it('should return false when extractor_version is null', async () => {
      const mockSupabase = createMockSupabaseClient({
        data: {
          id: 'doc123',
          extractor_version: null,
          input_hash: null,
        },
        error: null,
      })

      const result = await checkExtractionExists(
        mockSupabase as any,
        'doc123',
        'v1.0.0',
        'abc123',
      )

      expect(result.exists).toBe(false)
    })
  })
})

describe('Extraction Schema Validation', () => {
  describe('ExtractedDataSchema', () => {
    it('should validate valid extracted data', () => {
      const data = {
        lab_values: [
          {
            test_name: 'Cholesterol',
            value: 180,
            unit: 'mg/dL',
            reference_range: '< 200',
          },
        ],
        medications: [
          {
            name: 'Aspirin',
            dosage: '81mg',
            frequency: 'daily',
          },
        ],
        vital_signs: {
          blood_pressure: '120/80',
          heart_rate: 72,
        },
        diagnoses: ['Hypertension'],
      }

      const result = ExtractedDataSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should allow empty extracted data', () => {
      const data = {}
      const result = ExtractedDataSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should allow optional fields to be omitted', () => {
      const data = {
        lab_values: [],
      }
      const result = ExtractedDataSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject invalid lab value structure', () => {
      const data = {
        lab_values: [
          {
            // Missing required test_name
            value: 180,
          },
        ],
      }

      const result = ExtractedDataSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('ConfidenceMetadataSchema', () => {
    it('should validate valid confidence metadata', () => {
      const data = {
        overall_confidence: 0.85,
        field_confidence: {
          'lab_values.0.test_name': 0.95,
          'lab_values.0.value': 0.90,
        },
        evidence: {
          'lab_values.0': {
            page: 1,
            section: 'Lab Results',
            confidence_score: 0.92,
          },
        },
        extraction_timestamp: '2026-01-03T13:00:00Z',
      }

      const result = ConfidenceMetadataSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject confidence score above 1', () => {
      const data = {
        overall_confidence: 1.5,
        field_confidence: {},
        evidence: {},
        extraction_timestamp: '2026-01-03T13:00:00Z',
      }

      const result = ConfidenceMetadataSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject confidence score below 0', () => {
      const data = {
        overall_confidence: -0.1,
        field_confidence: {},
        evidence: {},
        extraction_timestamp: '2026-01-03T13:00:00Z',
      }

      const result = ConfidenceMetadataSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should require all mandatory fields', () => {
      const data = {
        overall_confidence: 0.8,
        // Missing field_confidence, evidence, extraction_timestamp
      }

      const result = ConfidenceMetadataSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('validateExtractedData', () => {
    it('should return valid result for correct data', () => {
      const data = {
        lab_values: [],
        medications: [],
      }

      const result = validateExtractedData(data)
      expect(result.valid).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.error).toBeUndefined()
    })

    it('should return error for invalid data', () => {
      const data = {
        lab_values: ['invalid'], // Should be array of objects
      }

      const result = validateExtractedData(data)
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('validateConfidenceMetadata', () => {
    it('should return valid result for correct metadata', () => {
      const data = {
        overall_confidence: 0.9,
        field_confidence: {},
        evidence: {},
        extraction_timestamp: '2026-01-03T13:00:00Z',
      }

      const result = validateConfidenceMetadata(data)
      expect(result.valid).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.error).toBeUndefined()
    })

    it('should return error for invalid metadata', () => {
      const data = {
        overall_confidence: 'high', // Should be number
        field_confidence: {},
        evidence: {},
        extraction_timestamp: '2026-01-03T13:00:00Z',
      }

      const result = validateConfidenceMetadata(data)
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
