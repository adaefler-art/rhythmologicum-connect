/**
 * Canonical Hash Tests - V05-I05.8
 * 
 * Tests for deterministic hashing with stable key ordering
 */

import { computeCanonicalPdfHash } from '../canonicalHash'

describe('Canonical PDF Hash', () => {
  const baseInput = {
    pdfTemplateVersion: 'v1.0.0',
    sectionsVersion: 'v1',
    sectionsData: {
      sections: [
        { sectionKey: 'overview', draft: 'Overview content' },
        { sectionKey: 'findings', draft: 'Findings content' },
      ],
    },
  }

  it('should produce deterministic hash for same input', () => {
    const hash1 = computeCanonicalPdfHash(baseInput)
    const hash2 = computeCanonicalPdfHash(baseInput)

    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64) // SHA-256 = 64 hex chars
  })

  it('should produce same hash regardless of key order', () => {
    const input1 = {
      pdfTemplateVersion: 'v1.0.0',
      sectionsVersion: 'v1',
      sectionsData: { a: 1, b: 2 },
    }

    const input2 = {
      sectionsData: { b: 2, a: 1 }, // Different key order
      pdfTemplateVersion: 'v1.0.0',
      sectionsVersion: 'v1',
    }

    const hash1 = computeCanonicalPdfHash(input1)
    const hash2 = computeCanonicalPdfHash(input2)

    expect(hash1).toBe(hash2)
  })

  it('should produce different hash when template version changes', () => {
    const input1 = { ...baseInput, pdfTemplateVersion: 'v1.0.0' }
    const input2 = { ...baseInput, pdfTemplateVersion: 'v1.0.1' }

    const hash1 = computeCanonicalPdfHash(input1)
    const hash2 = computeCanonicalPdfHash(input2)

    expect(hash1).not.toBe(hash2)
  })

  it('should produce different hash when sections version changes', () => {
    const input1 = { ...baseInput, sectionsVersion: 'v1' }
    const input2 = { ...baseInput, sectionsVersion: 'v2' }

    const hash1 = computeCanonicalPdfHash(input1)
    const hash2 = computeCanonicalPdfHash(input2)

    expect(hash1).not.toBe(hash2)
  })

  it('should produce different hash when sections data changes', () => {
    const input1 = {
      ...baseInput,
      sectionsData: { sections: [{ sectionKey: 'overview', draft: 'Content A' }] },
    }
    const input2 = {
      ...baseInput,
      sectionsData: { sections: [{ sectionKey: 'overview', draft: 'Content B' }] },
    }

    const hash1 = computeCanonicalPdfHash(input1)
    const hash2 = computeCanonicalPdfHash(input2)

    expect(hash1).not.toBe(hash2)
  })

  it('should handle nested objects consistently', () => {
    const input1 = {
      pdfTemplateVersion: 'v1.0.0',
      sectionsVersion: 'v1',
      sectionsData: {
        nested: {
          deep: {
            value: 'test',
            other: 123,
          },
        },
      },
    }

    const input2 = {
      sectionsVersion: 'v1',
      pdfTemplateVersion: 'v1.0.0',
      sectionsData: {
        nested: {
          deep: {
            other: 123, // Different key order
            value: 'test',
          },
        },
      },
    }

    const hash1 = computeCanonicalPdfHash(input1)
    const hash2 = computeCanonicalPdfHash(input2)

    expect(hash1).toBe(hash2)
  })

  it('should handle arrays consistently', () => {
    const input = {
      pdfTemplateVersion: 'v1.0.0',
      sectionsVersion: 'v1',
      sectionsData: {
        items: [1, 2, 3],
      },
    }

    const hash1 = computeCanonicalPdfHash(input)
    const hash2 = computeCanonicalPdfHash(input)

    expect(hash1).toBe(hash2)
  })
})
