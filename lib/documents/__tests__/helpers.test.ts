/**
 * Unit Tests for Document Upload Helpers
 * 
 * Tests validation, parsing status transitions, and helper functions
 */

import {
  isValidMimeType,
  isValidFileSize,
  isValidParsingStatusTransition,
  generateStoragePath,
  getFileExtension,
} from '../helpers'
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES, ParsingStatus } from '@/lib/types/documents'

describe('Document Upload Helpers', () => {
  describe('isValidMimeType', () => {
    it('should accept PDF files', () => {
      expect(isValidMimeType('application/pdf')).toBe(true)
    })

    it('should accept JPEG images', () => {
      expect(isValidMimeType('image/jpeg')).toBe(true)
      expect(isValidMimeType('image/jpg')).toBe(true)
    })

    it('should accept PNG images', () => {
      expect(isValidMimeType('image/png')).toBe(true)
    })

    it('should accept HEIC images', () => {
      expect(isValidMimeType('image/heic')).toBe(true)
      expect(isValidMimeType('image/heif')).toBe(true)
    })

    it('should reject unsupported file types', () => {
      expect(isValidMimeType('application/msword')).toBe(false)
      expect(isValidMimeType('text/plain')).toBe(false)
      expect(isValidMimeType('video/mp4')).toBe(false)
    })

    it('should reject empty or invalid MIME types', () => {
      expect(isValidMimeType('')).toBe(false)
      expect(isValidMimeType('invalid')).toBe(false)
    })
  })

  describe('isValidFileSize', () => {
    it('should accept files within size limit', () => {
      expect(isValidFileSize(1024)).toBe(true) // 1 KB
      expect(isValidFileSize(1024 * 1024)).toBe(true) // 1 MB
      expect(isValidFileSize(10 * 1024 * 1024)).toBe(true) // 10 MB
    })

    it('should accept files at exactly the max size', () => {
      expect(isValidFileSize(MAX_FILE_SIZE)).toBe(true)
    })

    it('should reject files over the size limit', () => {
      expect(isValidFileSize(MAX_FILE_SIZE + 1)).toBe(false)
      expect(isValidFileSize(100 * 1024 * 1024)).toBe(false) // 100 MB
    })

    it('should reject zero or negative sizes', () => {
      expect(isValidFileSize(0)).toBe(false)
      expect(isValidFileSize(-1)).toBe(false)
    })
  })

  describe('isValidParsingStatusTransition', () => {
    it('should allow pending -> processing', () => {
      expect(isValidParsingStatusTransition('pending', 'processing')).toBe(true)
    })

    it('should allow pending -> failed', () => {
      expect(isValidParsingStatusTransition('pending', 'failed')).toBe(true)
    })

    it('should allow processing -> completed', () => {
      expect(isValidParsingStatusTransition('processing', 'completed')).toBe(true)
    })

    it('should allow processing -> partial', () => {
      expect(isValidParsingStatusTransition('processing', 'partial')).toBe(true)
    })

    it('should allow processing -> failed', () => {
      expect(isValidParsingStatusTransition('processing', 'failed')).toBe(true)
    })

    it('should allow partial -> processing (retry)', () => {
      expect(isValidParsingStatusTransition('partial', 'processing')).toBe(true)
    })

    it('should allow partial -> completed', () => {
      expect(isValidParsingStatusTransition('partial', 'completed')).toBe(true)
    })

    it('should allow failed -> processing (retry)', () => {
      expect(isValidParsingStatusTransition('failed', 'processing')).toBe(true)
    })

    it('should reject completed -> any transition (terminal state)', () => {
      expect(isValidParsingStatusTransition('completed', 'processing')).toBe(false)
      expect(isValidParsingStatusTransition('completed', 'failed')).toBe(false)
      expect(isValidParsingStatusTransition('completed', 'pending')).toBe(false)
    })

    it('should reject invalid transitions', () => {
      expect(isValidParsingStatusTransition('pending', 'completed')).toBe(false)
      expect(isValidParsingStatusTransition('pending', 'partial')).toBe(false)
      expect(isValidParsingStatusTransition('processing', 'pending')).toBe(false)
    })
  })

  describe('generateStoragePath', () => {
    it('should generate path with correct structure', () => {
      const userId = 'user-123'
      const assessmentId = 'assessment-456'
      const filename = 'test.pdf'

      const path = generateStoragePath(userId, assessmentId, filename)

      expect(path).toMatch(/^user-123\/assessment-456\/\d+_test\.pdf$/)
    })

    it('should sanitize special characters in filename', () => {
      const userId = 'user-123'
      const assessmentId = 'assessment-456'
      const filename = 'my test file (1).pdf'

      const path = generateStoragePath(userId, assessmentId, filename)

      expect(path).toContain('my_test_file__1_.pdf')
    })

    it('should remove path traversal attempts', () => {
      const userId = 'user-123'
      const assessmentId = 'assessment-456'
      const filename = '../../../etc/passwd'

      const path = generateStoragePath(userId, assessmentId, filename)

      // Should not contain .. or /
      expect(path).not.toContain('..')
      // The sanitizer extracts basename, removes .., and results in 'passwd'
      expect(path).toMatch(/^user-123\/assessment-456\/\d+_passwd$/)
    })

    it('should remove control characters from filename', () => {
      const userId = 'user-123'
      const assessmentId = 'assessment-456'
      const filename = 'test\x00\x1F\x7F.pdf'

      const path = generateStoragePath(userId, assessmentId, filename)

      // Should not contain control chars
      expect(path).toMatch(/^user-123\/assessment-456\/\d+_test\.pdf$/)
    })

    it('should handle filenames starting with dot or dash', () => {
      const userId = 'user-123'
      const assessmentId = 'assessment-456'
      const filename1 = '.hidden'
      const filename2 = '-dash'

      const path1 = generateStoragePath(userId, assessmentId, filename1)
      const path2 = generateStoragePath(userId, assessmentId, filename2)

      expect(path1).toContain('file_.hidden')
      expect(path2).toContain('file_-dash')
    })

    it('should limit filename length', () => {
      const userId = 'user-123'
      const assessmentId = 'assessment-456'
      const longFilename = 'a'.repeat(300) + '.pdf'

      const path = generateStoragePath(userId, assessmentId, longFilename)

      const pathParts = path.split('/')
      const filename = pathParts[pathParts.length - 1]
      const filenameWithoutTimestamp = filename.substring(filename.indexOf('_') + 1)

      expect(filenameWithoutTimestamp.length).toBeLessThanOrEqual(200)
      expect(filenameWithoutTimestamp).toMatch(/\.pdf$/) // Extension preserved
    })

    it('should preserve allowed characters in filename', () => {
      const userId = 'user-123'
      const assessmentId = 'assessment-456'
      const filename = 'test-file_v2.0.pdf'

      const path = generateStoragePath(userId, assessmentId, filename)

      expect(path).toContain('test-file_v2.0.pdf')
    })

    it('should include timestamp to ensure uniqueness', () => {
      const userId = 'user-123'
      const assessmentId = 'assessment-456'
      const filename = 'test.pdf'

      const path = generateStoragePath(userId, assessmentId, filename)

      // Path should contain a numeric timestamp
      const timestampMatch = path.match(/\/(\d+)_test\.pdf$/)
      expect(timestampMatch).not.toBeNull()
      
      // Timestamp should be a reasonable value (not in distant past/future)
      const timestamp = parseInt(timestampMatch![1])
      const now = Date.now()
      expect(timestamp).toBeGreaterThan(now - 1000) // Within last second
      expect(timestamp).toBeLessThanOrEqual(now)
    })

    it('should handle backslash path separators', () => {
      const userId = 'user-123'
      const assessmentId = 'assessment-456'
      const filename = 'folder\\subfolder\\file.pdf'

      const path = generateStoragePath(userId, assessmentId, filename)

      // Should only use the basename
      expect(path).toMatch(/^user-123\/assessment-456\/\d+_file\.pdf$/)
    })
  })

  describe('getFileExtension', () => {
    it('should extract extension from filename', () => {
      expect(getFileExtension('document.pdf', 'application/pdf')).toBe('pdf')
      expect(getFileExtension('image.jpg', 'image/jpeg')).toBe('jpg')
      expect(getFileExtension('photo.PNG', 'image/png')).toBe('png')
    })

    it('should fallback to MIME type if no extension in filename', () => {
      expect(getFileExtension('document', 'application/pdf')).toBe('pdf')
      expect(getFileExtension('image', 'image/jpeg')).toBe('jpg')
      expect(getFileExtension('photo', 'image/png')).toBe('png')
    })

    it('should map MIME types correctly', () => {
      expect(getFileExtension('file', 'application/pdf')).toBe('pdf')
      expect(getFileExtension('file', 'image/jpeg')).toBe('jpg')
      expect(getFileExtension('file', 'image/jpg')).toBe('jpg')
      expect(getFileExtension('file', 'image/png')).toBe('png')
      expect(getFileExtension('file', 'image/heic')).toBe('heic')
      expect(getFileExtension('file', 'image/heif')).toBe('heif')
    })

    it('should return "bin" for unknown MIME types', () => {
      expect(getFileExtension('file', 'unknown/type')).toBe('bin')
    })

    it('should normalize extension to lowercase', () => {
      expect(getFileExtension('Document.PDF', 'application/pdf')).toBe('pdf')
      expect(getFileExtension('Image.JPG', 'image/jpeg')).toBe('jpg')
    })
  })
})
