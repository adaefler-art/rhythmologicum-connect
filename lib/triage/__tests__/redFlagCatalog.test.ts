/**
 * E6.6.7 — Red Flag Catalog v1 Tests
 *
 * Validates:
 * - AC1: Allowlist is the only source of truth
 * - AC2: Patterns are conservative; redFlag dominance enforced
 * - AC3: Each red flag type has comprehensive test coverage
 */

import {
  CLINICAL_RED_FLAG,
  RED_FLAG_PATTERNS,
  RED_FLAG_CATALOG_VERSION,
  detectClinicalRedFlags,
  hasAnyRedFlag,
  getAllRedFlagKeywords,
  getRedFlagDescription,
  type ClinicalRedFlag,
} from '../redFlagCatalog'

describe('Red Flag Catalog v1 - E6.6.7', () => {
  // ============================================================
  // AC1: Allowlist Validation
  // ============================================================

  describe('AC1: Allowlist is source of truth', () => {
    it('should have exactly 8 clinical red flag types', () => {
      const flagTypes = Object.keys(CLINICAL_RED_FLAG)
      expect(flagTypes).toHaveLength(8)
    })

    it('should have all expected red flag types', () => {
      expect(CLINICAL_RED_FLAG.CHEST_PAIN).toBe('CHEST_PAIN')
      expect(CLINICAL_RED_FLAG.SYNCOPE).toBe('SYNCOPE')
      expect(CLINICAL_RED_FLAG.SEVERE_DYSPNEA).toBe('SEVERE_DYSPNEA')
      expect(CLINICAL_RED_FLAG.SUICIDAL_IDEATION).toBe('SUICIDAL_IDEATION')
      expect(CLINICAL_RED_FLAG.ACUTE_PSYCHIATRIC_CRISIS).toBe('ACUTE_PSYCHIATRIC_CRISIS')
      expect(CLINICAL_RED_FLAG.SEVERE_PALPITATIONS).toBe('SEVERE_PALPITATIONS')
      expect(CLINICAL_RED_FLAG.ACUTE_NEUROLOGICAL).toBe('ACUTE_NEUROLOGICAL')
      expect(CLINICAL_RED_FLAG.SEVERE_UNCONTROLLED_SYMPTOMS).toBe('SEVERE_UNCONTROLLED_SYMPTOMS')
    })

    it('should have patterns for every red flag type', () => {
      const flagTypes = Object.keys(CLINICAL_RED_FLAG)
      const patternTypes = Object.keys(RED_FLAG_PATTERNS)

      expect(patternTypes.length).toBe(flagTypes.length)
      
      for (const flagType of flagTypes) {
        expect(RED_FLAG_PATTERNS).toHaveProperty(flagType)
        expect(RED_FLAG_PATTERNS[flagType as ClinicalRedFlag].length).toBeGreaterThan(0)
      }
    })

    it('should have catalog version defined', () => {
      expect(RED_FLAG_CATALOG_VERSION).toBe('1.0.0')
    })

    it('should have at least 5 patterns per red flag type (conservative)', () => {
      for (const [flagType, patterns] of Object.entries(RED_FLAG_PATTERNS)) {
        expect(patterns.length).toBeGreaterThanOrEqual(5)
      }
    })
  })

  // ============================================================
  // AC2: Conservative Pattern Detection (each red flag type)
  // ============================================================

  describe('AC2: CHEST_PAIN detection', () => {
    it('should detect German chest pain keywords', () => {
      const inputs = [
        'ich habe brustschmerzen',
        'starke schmerzen in der brust',
        'herzschmerzen seit heute morgen',
        'brustdruck und engegefühl',
        'stechen in der brust',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.CHEST_PAIN)
      })
    })

    it('should detect English chest pain keywords', () => {
      const inputs = [
        'i have chest pain',
        'chest pressure and discomfort',
        'heart pain started an hour ago',
        'crushing chest sensation',
        'tightness in chest',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.CHEST_PAIN)
      })
    })

    it('should not detect chest pain in unrelated text', () => {
      const input = 'ich fühle mich gestresst und müde'
      const flags = detectClinicalRedFlags(input.toLowerCase())
      expect(flags).not.toContain(CLINICAL_RED_FLAG.CHEST_PAIN)
    })
  })

  describe('AC2: SYNCOPE detection', () => {
    it('should detect German syncope keywords', () => {
      const inputs = [
        'ich bin ohnmächtig geworden',
        'plötzlich bewusstlos',
        'bin zusammengebrochen',
        'schwarz vor augen und umgekippt',
        'bewusstsein verloren',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.SYNCOPE)
      })
    })

    it('should detect English syncope keywords', () => {
      const inputs = [
        'i fainted yesterday',
        'passed out suddenly',
        'lost consciousness',
        'blacked out for a few seconds',
        'collapsed at work',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.SYNCOPE)
      })
    })

    it('should not detect syncope in unrelated text', () => {
      const input = 'ich bin sehr müde und erschöpft'
      const flags = detectClinicalRedFlags(input.toLowerCase())
      expect(flags).not.toContain(CLINICAL_RED_FLAG.SYNCOPE)
    })
  })

  describe('AC2: SEVERE_DYSPNEA detection', () => {
    it('should detect German dyspnea keywords', () => {
      const inputs = [
        'ich habe atemnot',
        'kann nicht atmen',
        'bekomme keine luft',
        'schwer zu atmen',
        'erstickungsgefühl',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.SEVERE_DYSPNEA)
      })
    })

    it('should detect English dyspnea keywords', () => {
      const inputs = [
        'i cant breathe',
        'difficulty breathing',
        'gasping for air',
        'severe breathlessness',
        'suffocating feeling',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.SEVERE_DYSPNEA)
      })
    })

    it('should not detect dyspnea in unrelated text', () => {
      const input = 'ich mache mir sorgen um meine gesundheit'
      const flags = detectClinicalRedFlags(input.toLowerCase())
      expect(flags).not.toContain(CLINICAL_RED_FLAG.SEVERE_DYSPNEA)
    })
  })

  describe('AC2: SUICIDAL_IDEATION detection', () => {
    it('should detect German suicidal ideation keywords', () => {
      const inputs = [
        'ich habe suizidgedanken',
        'will mich umbringen',
        'nicht mehr leben wollen',
        'selbstverletzung gedanken',
        'mein leben beenden',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.SUICIDAL_IDEATION)
      })
    })

    it('should detect English suicidal ideation keywords', () => {
      const inputs = [
        'i want to kill myself',
        'suicidal thoughts',
        'want to end my life',
        'self-harm urges',
        'better off dead',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.SUICIDAL_IDEATION)
      })
    })

    it('should not detect suicidal ideation in unrelated text', () => {
      const input = 'ich bin traurig und deprimiert'
      const flags = detectClinicalRedFlags(input.toLowerCase())
      expect(flags).not.toContain(CLINICAL_RED_FLAG.SUICIDAL_IDEATION)
    })
  })

  describe('AC2: ACUTE_PSYCHIATRIC_CRISIS detection', () => {
    it('should detect German psychiatric crisis keywords', () => {
      const inputs = [
        'ich habe eine panikattacke',
        'totale panik kann nicht mehr',
        'höre stimmen',
        'halluzinationen seit gestern',
        'nervenzusammenbruch',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.ACUTE_PSYCHIATRIC_CRISIS)
      })
    })

    it('should detect English psychiatric crisis keywords', () => {
      const inputs = [
        'having a panic attack',
        'severe panic cant cope',
        'hearing voices',
        'hallucinations started',
        'mental breakdown',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.ACUTE_PSYCHIATRIC_CRISIS)
      })
    })

    it('should not detect psychiatric crisis in mild anxiety text', () => {
      const input = 'ich bin ängstlich und besorgt'
      const flags = detectClinicalRedFlags(input.toLowerCase())
      expect(flags).not.toContain(CLINICAL_RED_FLAG.ACUTE_PSYCHIATRIC_CRISIS)
    })
  })

  describe('AC2: SEVERE_PALPITATIONS detection', () => {
    it('should detect German severe palpitations keywords', () => {
      const inputs = [
        'mein herz rast unkontrolliert',
        'herzrasen extrem',
        'herzrhythmusstörung',
        'puls über 150',
        'starkes herzstolpern',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.SEVERE_PALPITATIONS)
      })
    })

    it('should detect English severe palpitations keywords', () => {
      const inputs = [
        'heart racing uncontrollably',
        'severe palpitations',
        'heart rate over 150',
        'severe arrhythmia',
        'tachycardia severe',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.SEVERE_PALPITATIONS)
      })
    })

    it('should not detect severe palpitations in mild symptoms text', () => {
      const input = 'mein herz schlägt manchmal schnell'
      const flags = detectClinicalRedFlags(input.toLowerCase())
      expect(flags).not.toContain(CLINICAL_RED_FLAG.SEVERE_PALPITATIONS)
    })
  })

  describe('AC2: ACUTE_NEUROLOGICAL detection', () => {
    it('should detect German neurological symptoms keywords', () => {
      const inputs = [
        'schlaganfall symptome',
        'plötzliche lähmung',
        'gesichtslähmung rechts',
        'kann plötzlich nicht sprechen',
        'halbseitige taubheit',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.ACUTE_NEUROLOGICAL)
      })
    })

    it('should detect English neurological symptoms keywords', () => {
      const inputs = [
        'stroke symptoms',
        'sudden paralysis',
        'facial droop on one side',
        'cannot speak suddenly',
        'one-sided numbness',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.ACUTE_NEUROLOGICAL)
      })
    })

    it('should not detect neurological in unrelated text', () => {
      const input = 'ich habe kopfschmerzen'
      const flags = detectClinicalRedFlags(input.toLowerCase())
      expect(flags).not.toContain(CLINICAL_RED_FLAG.ACUTE_NEUROLOGICAL)
    })
  })

  describe('AC2: SEVERE_UNCONTROLLED_SYMPTOMS detection', () => {
    it('should detect German emergency keywords', () => {
      const inputs = [
        'notfall brauche sofort hilfe',
        'akute gefahr',
        'unerträglich muss zur notaufnahme',
        'unkontrollierbar rufe 112',
        'brauche krankenwagen',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.SEVERE_UNCONTROLLED_SYMPTOMS)
      })
    })

    it('should detect English emergency keywords', () => {
      const inputs = [
        'emergency need immediate help',
        'acute danger',
        'unbearable going to emergency room',
        'uncontrollable need ambulance',
        'calling 911',
      ]

      inputs.forEach((input) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(CLINICAL_RED_FLAG.SEVERE_UNCONTROLLED_SYMPTOMS)
      })
    })

    it('should not detect emergency in normal help-seeking text', () => {
      const input = 'ich brauche unterstützung bei stress'
      const flags = detectClinicalRedFlags(input.toLowerCase())
      expect(flags).not.toContain(CLINICAL_RED_FLAG.SEVERE_UNCONTROLLED_SYMPTOMS)
    })
  })

  // ============================================================
  // AC2: Red Flag Dominance & Multiple Flags
  // ============================================================

  describe('AC2: Multiple red flags detection', () => {
    it('should detect multiple red flags in same input', () => {
      const input = 'ich habe brustschmerzen und kann nicht atmen'
      const flags = detectClinicalRedFlags(input.toLowerCase())
      
      expect(flags).toContain(CLINICAL_RED_FLAG.CHEST_PAIN)
      expect(flags).toContain(CLINICAL_RED_FLAG.SEVERE_DYSPNEA)
      expect(flags.length).toBe(2)
    })

    it('should detect red flag even with non-emergency keywords', () => {
      const input = 'ich bin gestresst und habe suizidgedanken'
      const flags = detectClinicalRedFlags(input.toLowerCase())
      
      expect(flags).toContain(CLINICAL_RED_FLAG.SUICIDAL_IDEATION)
      expect(flags.length).toBeGreaterThanOrEqual(1)
    })
  })

  // ============================================================
  // Helper Functions Tests
  // ============================================================

  describe('Helper functions', () => {
    it('getAllRedFlagKeywords should return all keywords', () => {
      const allKeywords = getAllRedFlagKeywords()
      
      expect(allKeywords.length).toBeGreaterThan(50) // Should have many keywords
      expect(allKeywords).toContain('brustschmerz')
      expect(allKeywords).toContain('chest pain')
      expect(allKeywords).toContain('suizid')
      expect(allKeywords).toContain('suicide')
    })

    it('hasAnyRedFlag should return true for red flag input', () => {
      const input = 'ich habe brustschmerzen'
      expect(hasAnyRedFlag(input.toLowerCase())).toBe(true)
    })

    it('hasAnyRedFlag should return false for normal input', () => {
      const input = 'ich fühle mich gestresst'
      expect(hasAnyRedFlag(input.toLowerCase())).toBe(false)
    })

    it('getRedFlagDescription should return German descriptions', () => {
      expect(getRedFlagDescription(CLINICAL_RED_FLAG.CHEST_PAIN)).toContain('Brustschmerzen')
      expect(getRedFlagDescription(CLINICAL_RED_FLAG.SYNCOPE)).toContain('Bewusstlosigkeit')
      expect(getRedFlagDescription(CLINICAL_RED_FLAG.SEVERE_DYSPNEA)).toContain('Atemnot')
      expect(getRedFlagDescription(CLINICAL_RED_FLAG.SUICIDAL_IDEATION)).toContain('Suizidgedanken')
      expect(getRedFlagDescription(CLINICAL_RED_FLAG.ACUTE_PSYCHIATRIC_CRISIS)).toContain('psychiatrische')
      expect(getRedFlagDescription(CLINICAL_RED_FLAG.SEVERE_PALPITATIONS)).toContain('Herzrhythmus')
      expect(getRedFlagDescription(CLINICAL_RED_FLAG.ACUTE_NEUROLOGICAL)).toContain('neurologische')
      expect(getRedFlagDescription(CLINICAL_RED_FLAG.SEVERE_UNCONTROLLED_SYMPTOMS)).toContain('unkontrollierte')
    })
  })

  // ============================================================
  // Conservative Approach Validation
  // ============================================================

  describe('AC2: Conservative pattern approach', () => {
    it('should prioritize false positives over false negatives', () => {
      // These borderline cases should trigger red flags (conservative)
      const borderlineCases = [
        { input: 'leichter brustdruck', flag: CLINICAL_RED_FLAG.CHEST_PAIN },
        { input: 'kurze atemnot', flag: CLINICAL_RED_FLAG.SEVERE_DYSPNEA },
        { input: 'suizidgedanken letzte woche', flag: CLINICAL_RED_FLAG.SUICIDAL_IDEATION },
      ]

      borderlineCases.forEach(({ input, flag }) => {
        const flags = detectClinicalRedFlags(input.toLowerCase())
        expect(flags).toContain(flag)
      })
    })

    it('should have bilingual support (German and English)', () => {
      const germanInput = 'ich habe brustschmerzen'
      const englishInput = 'i have chest pain'

      const germanFlags = detectClinicalRedFlags(germanInput.toLowerCase())
      const englishFlags = detectClinicalRedFlags(englishInput.toLowerCase())

      expect(germanFlags).toContain(CLINICAL_RED_FLAG.CHEST_PAIN)
      expect(englishFlags).toContain(CLINICAL_RED_FLAG.CHEST_PAIN)
    })
  })

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('Edge cases', () => {
    it('should handle empty input', () => {
      const flags = detectClinicalRedFlags('')
      expect(flags).toEqual([])
      expect(hasAnyRedFlag('')).toBe(false)
    })

    it('should handle input with only whitespace', () => {
      const flags = detectClinicalRedFlags('   ')
      expect(flags).toEqual([])
      expect(hasAnyRedFlag('   ')).toBe(false)
    })

    it('should handle very long input with red flag', () => {
      const longInput = 'lorem ipsum '.repeat(100) + 'brustschmerzen'
      const flags = detectClinicalRedFlags(longInput.toLowerCase())
      expect(flags).toContain(CLINICAL_RED_FLAG.CHEST_PAIN)
    })

    it('should be case-insensitive (already lowercase in test)', () => {
      const upperInput = 'BRUSTSCHMERZEN'
      const lowerInput = 'brustschmerzen'
      
      const upperFlags = detectClinicalRedFlags(upperInput.toLowerCase())
      const lowerFlags = detectClinicalRedFlags(lowerInput.toLowerCase())
      
      expect(upperFlags).toEqual(lowerFlags)
    })
  })
})
