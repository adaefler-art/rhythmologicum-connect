/**
 * Unit Tests for Funnel Type System
 * 
 * Tests NODE_TYPE constants and type guard functions
 */

import {
  NODE_TYPE,
  isQuestionStep,
  isInfoStep,
  isContentPageStep,
  type QuestionStepDefinition,
  type InfoStepDefinition,
  type ContentPageStepDefinition,
  type OtherStepDefinition,
} from '../funnel'

describe('NODE_TYPE constants', () => {
  it('should define all node type constants', () => {
    expect(NODE_TYPE.QUESTION_STEP).toBe('question_step')
    expect(NODE_TYPE.FORM).toBe('form')
    expect(NODE_TYPE.INFO_STEP).toBe('info_step')
    expect(NODE_TYPE.INFO).toBe('info')
    expect(NODE_TYPE.CONTENT_PAGE).toBe('content_page')
    expect(NODE_TYPE.SUMMARY).toBe('summary')
    expect(NODE_TYPE.OTHER).toBe('other')
  })

  it('should contain all expected node type values', () => {
    const values = Object.values(NODE_TYPE)
    expect(values).toContain('question_step')
    expect(values).toContain('form')
    expect(values).toContain('info_step')
    expect(values).toContain('info')
    expect(values).toContain('content_page')
    expect(values).toContain('summary')
    expect(values).toContain('other')
  })

  it('should be read-only at TypeScript level', () => {
    // TypeScript should prevent assignment (compile-time check)
    // This test verifies the constants exist and are correct
    expect(Object.isFrozen(NODE_TYPE)).toBe(false) // Note: as const doesn't freeze at runtime
    expect(typeof NODE_TYPE.CONTENT_PAGE).toBe('string')
  })
})

describe('Type Guard Functions', () => {
  describe('isQuestionStep', () => {
    it('should return true for question_step type', () => {
      const step: QuestionStepDefinition = {
        id: 'test-id',
        orderIndex: 0,
        title: 'Test Question',
        description: null,
        type: NODE_TYPE.QUESTION_STEP,
        questions: [],
      }
      expect(isQuestionStep(step)).toBe(true)
    })

    it('should return true for form type', () => {
      const step: QuestionStepDefinition = {
        id: 'test-id',
        orderIndex: 0,
        title: 'Test Form',
        description: null,
        type: NODE_TYPE.FORM,
        questions: [],
      }
      expect(isQuestionStep(step)).toBe(true)
    })

    it('should return false for info_step type', () => {
      const step: InfoStepDefinition = {
        id: 'test-id',
        orderIndex: 0,
        title: 'Test Info',
        description: null,
        type: NODE_TYPE.INFO_STEP,
        content: '',
      }
      expect(isQuestionStep(step)).toBe(false)
    })

    it('should return false for content_page type', () => {
      const step: ContentPageStepDefinition = {
        id: 'test-id',
        orderIndex: 0,
        title: 'Test Content',
        description: null,
        type: NODE_TYPE.CONTENT_PAGE,
        contentPageId: 'page-id',
      }
      expect(isQuestionStep(step)).toBe(false)
    })
  })

  describe('isInfoStep', () => {
    it('should return true for info_step type', () => {
      const step: InfoStepDefinition = {
        id: 'test-id',
        orderIndex: 0,
        title: 'Test Info',
        description: null,
        type: NODE_TYPE.INFO_STEP,
        content: '',
      }
      expect(isInfoStep(step)).toBe(true)
    })

    it('should return true for info type', () => {
      const step: InfoStepDefinition = {
        id: 'test-id',
        orderIndex: 0,
        title: 'Test Info',
        description: null,
        type: NODE_TYPE.INFO,
        content: '',
      }
      expect(isInfoStep(step)).toBe(true)
    })

    it('should return false for question_step type', () => {
      const step: QuestionStepDefinition = {
        id: 'test-id',
        orderIndex: 0,
        title: 'Test Question',
        description: null,
        type: NODE_TYPE.QUESTION_STEP,
        questions: [],
      }
      expect(isInfoStep(step)).toBe(false)
    })

    it('should return false for content_page type', () => {
      const step: ContentPageStepDefinition = {
        id: 'test-id',
        orderIndex: 0,
        title: 'Test Content',
        description: null,
        type: NODE_TYPE.CONTENT_PAGE,
        contentPageId: 'page-id',
      }
      expect(isInfoStep(step)).toBe(false)
    })
  })

  describe('isContentPageStep', () => {
    it('should return true for content_page type', () => {
      const step: ContentPageStepDefinition = {
        id: 'test-id',
        orderIndex: 0,
        title: 'Test Content',
        description: null,
        type: NODE_TYPE.CONTENT_PAGE,
        contentPageId: 'page-id',
      }
      expect(isContentPageStep(step)).toBe(true)
    })

    it('should return true for content_page type with contentPage data', () => {
      const step: ContentPageStepDefinition = {
        id: 'test-id',
        orderIndex: 0,
        title: 'Test Content',
        description: null,
        type: NODE_TYPE.CONTENT_PAGE,
        contentPageId: 'page-id',
        contentPage: {
          id: 'page-id',
          slug: 'test-page',
          title: 'Test Page',
          excerpt: null,
          body_markdown: '# Test Content',
          status: 'published',
        },
      }
      expect(isContentPageStep(step)).toBe(true)
    })

    it('should return false for question_step type', () => {
      const step: QuestionStepDefinition = {
        id: 'test-id',
        orderIndex: 0,
        title: 'Test Question',
        description: null,
        type: NODE_TYPE.QUESTION_STEP,
        questions: [],
      }
      expect(isContentPageStep(step)).toBe(false)
    })

    it('should return false for info_step type', () => {
      const step: InfoStepDefinition = {
        id: 'test-id',
        orderIndex: 0,
        title: 'Test Info',
        description: null,
        type: NODE_TYPE.INFO_STEP,
        content: '',
      }
      expect(isContentPageStep(step)).toBe(false)
    })

    it('should return false for summary type', () => {
      const step: OtherStepDefinition = {
        id: 'test-id',
        orderIndex: 0,
        title: 'Test Summary',
        description: null,
        type: NODE_TYPE.SUMMARY,
      }
      expect(isContentPageStep(step)).toBe(false)
    })
  })

  describe('Type narrowing', () => {
    it('should narrow type to QuestionStepDefinition when isQuestionStep returns true', () => {
      const step: QuestionStepDefinition = {
        id: 'test-id',
        orderIndex: 0,
        title: 'Test',
        description: null,
        type: NODE_TYPE.QUESTION_STEP,
        questions: [
          {
            id: 'q1',
            key: 'test_q1',
            label: 'Test Question',
            helpText: null,
            questionType: 'scale',
            minValue: 1,
            maxValue: 10,
            isRequired: true,
            orderIndex: 0,
          },
        ],
      }

      if (isQuestionStep(step)) {
        // TypeScript should infer step as QuestionStepDefinition
        expect(step.questions).toBeDefined()
        expect(step.questions.length).toBe(1)
      }
    })

    it('should narrow type to ContentPageStepDefinition when isContentPageStep returns true', () => {
      const step: ContentPageStepDefinition = {
        id: 'test-id',
        orderIndex: 0,
        title: 'Test',
        description: null,
        type: NODE_TYPE.CONTENT_PAGE,
        contentPageId: 'page-id',
      }

      if (isContentPageStep(step)) {
        // TypeScript should infer step as ContentPageStepDefinition
        expect(step.contentPageId).toBeDefined()
        expect(step.contentPageId).toBe('page-id')
      }
    })
  })
})

describe('Backward Compatibility', () => {
  it('should work with string literal types from database', () => {
    // Simulate data coming from database with string literals
    const stepFromDb = {
      id: 'test-id',
      orderIndex: 0,
      title: 'Test',
      description: null,
      type: 'content_page',
      contentPageId: 'page-id',
    }

    expect(isContentPageStep(stepFromDb as ContentPageStepDefinition)).toBe(true)
  })

  it('should handle all legacy string types', () => {
    const questionStep = { type: 'question_step', questions: [] }
    const formStep = { type: 'form', questions: [] }
    const infoStep = { type: 'info_step', content: '' }
    const infoStep2 = { type: 'info', content: '' }
    const contentPageStep = { type: 'content_page', contentPageId: 'id' }

    expect(isQuestionStep(questionStep as QuestionStepDefinition)).toBe(true)
    expect(isQuestionStep(formStep as QuestionStepDefinition)).toBe(true)
    expect(isInfoStep(infoStep as InfoStepDefinition)).toBe(true)
    expect(isInfoStep(infoStep2 as InfoStepDefinition)).toBe(true)
    expect(isContentPageStep(contentPageStep as ContentPageStepDefinition)).toBe(true)
  })
})
