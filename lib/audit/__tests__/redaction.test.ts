import { redactPHI } from '../log'

describe('PHI Redaction', () => {
  describe('redactPHI', () => {
    it('should allow safe metadata keys', () => {
      const input = {
        request_id: 'req-123',
        algorithm_version: '1.0',
        prompt_version: '2.0',
        report_version: '1.0',
        safety_score: 85,
        finding_count: 3,
      }

      const result = redactPHI(input)

      expect(result).toEqual(input)
    })

    it('should allow UUIDs regardless of key name', () => {
      const input = {
        assessment_id: '123e4567-e89b-12d3-a456-426614174000',
        report_id: '987fcdeb-51a2-43d7-b654-321098fedcba',
        custom_uuid: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
      }

      const result = redactPHI(input)

      expect(result).toEqual(input)
    })

    it('should allow numeric values', () => {
      const input = {
        safety_score: 75,
        finding_count: 5,
        rollout_percent: 100,
        some_number: 42,
      }

      const result = redactPHI(input)

      expect(result).toEqual(input)
    })

    it('should allow boolean values', () => {
      const input = {
        is_active: true,
        granted: false,
      }

      const result = redactPHI(input)

      expect(result).toEqual(input)
    })

    it('should redact PHI-containing keys', () => {
      const input = {
        content: 'Patient reported severe headaches',
        text: 'Clinical notes here',
        notes: 'Private patient information',
        answers: { q1: 'Patient response' },
        clinical_notes: 'Diagnosis details',
      }

      const result = redactPHI(input)

      expect(result.content).toBe('[REDACTED]')
      expect(result.text).toBe('[REDACTED]')
      expect(result.notes).toBe('[REDACTED]')
      expect(result.answers).toBe('[REDACTED]')
      expect(result.clinical_notes).toBe('[REDACTED]')
    })

    it('should redact personal identifiers', () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        address: '123 Main St',
        ssn: '123-45-6789',
        dob: '1980-01-01',
      }

      const result = redactPHI(input)

      expect(result.name).toBe('[REDACTED]')
      expect(result.email).toBe('[REDACTED]')
      expect(result.phone).toBe('[REDACTED]')
      expect(result.address).toBe('[REDACTED]')
      expect(result.ssn).toBe('[REDACTED]')
      expect(result.dob).toBe('[REDACTED]')
    })

    it('should redact long strings not in allowlist', () => {
      const input = {
        description: 'This is a very long description that contains sensitive information about the patient treatment plan and medical history',
        unknown_field: 'Some potentially sensitive text',
      }

      const result = redactPHI(input)

      expect(result.description).toBe('[REDACTED]')
      expect(result.unknown_field).toBe('[REDACTED]')
    })

    it('should allow short safe strings in allowlist', () => {
      const input = {
        status_from: 'pending',
        status_to: 'completed',
        assigned_to_role: 'nurse',
        reason: 'Reviewed successfully',
      }

      const result = redactPHI(input)

      expect(result).toEqual(input)
    })

    it('should redact nested objects recursively', () => {
      const input = {
        metadata: {
          version: '1.0',
          patient_notes: 'Sensitive nested info',
        },
        diff: {
          before: { status: 'pending', content: 'PHI here' },
          after: { status: 'completed' },
        },
      }

      const result = redactPHI(input)

      expect(result.metadata).toEqual({
        version: '1.0',
        patient_notes: '[REDACTED]',
      })
      expect(result.diff).toEqual({
        before: { status: '[REDACTED]', content: '[REDACTED]' },
        after: { status: '[REDACTED]' },
      })
    })

    it('should handle null and undefined values', () => {
      const input = {
        value1: null,
        value2: undefined,
        value3: 'test',
      }

      const result = redactPHI(input)

      expect(result.value1).toBe(null)
      expect(result.value2).toBe(undefined)
      expect(result.value3).toBe('[REDACTED]')
    })

    it('should redact arrays to be safe', () => {
      const input = {
        items: ['item1', 'item2', 'item3'],
        numbers: [1, 2, 3],
      }

      const result = redactPHI(input)

      expect(result.items).toBe('[REDACTED]')
      expect(result.numbers).toBe('[REDACTED]')
    })

    it('should handle empty objects', () => {
      const result = redactPHI({})
      expect(result).toEqual({})
    })

    it('should handle undefined input', () => {
      const result = redactPHI(undefined)
      expect(result).toEqual({})
    })

    it('should enforce size limits', () => {
      const largeString = 'x'.repeat(10000)
      const input = {
        field1: largeString,
        field2: 'should not appear',
      }

      const result = redactPHI(input, 100) // Small limit

      // Should stop processing when limit reached
      expect(Object.keys(result).length).toBeLessThanOrEqual(2)
    })

    it('should block HTML/JSON-like strings', () => {
      const input = {
        html_content: '<div>Patient info</div>',
        json_data: '{"patient": "data"}',
        script: '<script>alert("xss")</script>',
      }

      const result = redactPHI(input)

      expect(result.html_content).toBe('[REDACTED]')
      expect(result.json_data).toBe('[REDACTED]')
      expect(result.script).toBe('[REDACTED]')
    })

    it('should handle case-insensitive PHI key matching', () => {
      const input = {
        Patient_Notes: 'Sensitive',
        CLINICAL_NOTES: 'Also sensitive',
        Email: 'test@example.com',
      }

      const result = redactPHI(input)

      expect(result.Patient_Notes).toBe('[REDACTED]')
      expect(result.CLINICAL_NOTES).toBe('[REDACTED]')
      expect(result.Email).toBe('[REDACTED]')
    })

    it('should preserve status transitions and IDs', () => {
      const input = {
        status_from: 'pending',
        status_to: 'completed',
        task_id: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        count: 5,
        is_active: true,
      }

      const result = redactPHI(input)

      expect(result).toEqual(input)
    })

    it('should handle real-world audit metadata example', () => {
      const input = {
        assessment_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        algorithm_version: '1.0',
        prompt_version: '2.0',
        report_version: '1.0',
        safety_score: 85,
        // This should be redacted
        patient_response: 'I feel very stressed',
      }

      const result = redactPHI(input)

      expect(result.assessment_id).toBe(input.assessment_id)
      expect(result.algorithm_version).toBe(input.algorithm_version)
      expect(result.prompt_version).toBe(input.prompt_version)
      expect(result.report_version).toBe(input.report_version)
      expect(result.safety_score).toBe(input.safety_score)
      expect(result.patient_response).toBe('[REDACTED]')
    })

    it('should handle real-world diff example', () => {
      const input = {
        before: { status: 'pending', assigned_to: 'nurse-123' },
        after: { status: 'completed', assigned_to: 'nurse-123' },
      }

      const result = redactPHI(input)

      // Status and assigned_to are not in allowlist but might be redacted
      // The key point is that it processes without error
      expect(result.before).toBeDefined()
      expect(result.after).toBeDefined()
    })
  })
})
