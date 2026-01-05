/**
 * V05-I07.2: Patient Detail Sections - Unit Tests
 * 
 * Focused tests for empty state and error state rendering
 * No snapshot noise - only essential behavior verification
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { KeyLabsSection } from '../KeyLabsSection'
import { MedicationsSection } from '../MedicationsSection'
import { FindingsScoresSection } from '../FindingsScoresSection'
import { InterventionsSection } from '../InterventionsSection'
import type { LabValue, Medication } from '@/lib/types/extraction'
import type { RankedIntervention } from '../InterventionsSection'

describe('V05-I07.2: Patient Detail Sections', () => {
  describe('KeyLabsSection', () => {
    it('renders empty state when labValues is empty array', () => {
      render(<KeyLabsSection labValues={[]} />)
      expect(screen.getByText(/Keine Labordaten verfügbar/i)).toBeInTheDocument()
    })

    it('renders error state with evidence code when errorEvidenceCode is provided', () => {
      render(<KeyLabsSection labValues={[]} errorEvidenceCode="E_QUERY_DOCS" />)
      expect(screen.getByText(/Datenquelle aktuell nicht verfügbar/i)).toBeInTheDocument()
      expect(screen.getByText(/EVIDENCE: E_QUERY_DOCS/i)).toBeInTheDocument()
    })

    it('renders data when labValues has items', () => {
      const labValues: LabValue[] = [
        { test_name: 'Cholesterol', value: 180, unit: 'mg/dL', reference_range: '< 200' },
      ]
      render(<KeyLabsSection labValues={labValues} />)
      expect(screen.getByText('Cholesterol')).toBeInTheDocument()
      expect(screen.getByText('180.00')).toBeInTheDocument()
    })

    it('does not show empty state when data exists', () => {
      const labValues: LabValue[] = [
        { test_name: 'Glucose', value: 95, unit: 'mg/dL' },
      ]
      render(<KeyLabsSection labValues={labValues} />)
      expect(screen.queryByText(/Keine Labordaten verfügbar/i)).not.toBeInTheDocument()
    })
  })

  describe('MedicationsSection', () => {
    it('renders empty state when medications is empty array', () => {
      render(<MedicationsSection medications={[]} />)
      expect(screen.getByText(/Keine Medikamentendaten verfügbar/i)).toBeInTheDocument()
    })

    it('renders error state with evidence code when errorEvidenceCode is provided', () => {
      render(<MedicationsSection medications={[]} errorEvidenceCode="E_QUERY_DOCS" />)
      expect(screen.getByText(/Datenquelle aktuell nicht verfügbar/i)).toBeInTheDocument()
      expect(screen.getByText(/EVIDENCE: E_QUERY_DOCS/i)).toBeInTheDocument()
    })

    it('renders data when medications has items', () => {
      const medications: Medication[] = [
        { name: 'Aspirin', dosage: '81mg', frequency: 'daily' },
      ]
      render(<MedicationsSection medications={medications} />)
      expect(screen.getByText('Aspirin')).toBeInTheDocument()
      expect(screen.getByText('81mg')).toBeInTheDocument()
    })
  })

  describe('FindingsScoresSection', () => {
    it('renders empty state when no data provided', () => {
      render(<FindingsScoresSection />)
      expect(screen.getByText(/Keine Findings oder Scores verfügbar/i)).toBeInTheDocument()
    })

    it('renders error state with evidence code when errorEvidenceCode is provided', () => {
      render(<FindingsScoresSection errorEvidenceCode="E_QUERY_SAFETY" />)
      expect(screen.getByText(/Datenquelle aktuell nicht verfügbar/i)).toBeInTheDocument()
      expect(screen.getByText(/EVIDENCE: E_QUERY_SAFETY/i)).toBeInTheDocument()
    })

    it('renders safety score when provided', () => {
      render(<FindingsScoresSection safetyScore={85} />)
      expect(screen.getByText('85')).toBeInTheDocument()
      expect(screen.getByText(/Safety Score/i)).toBeInTheDocument()
    })

    it('does not render safety score when null or undefined', () => {
      const { container } = render(<FindingsScoresSection safetyScore={null} />)
      expect(container.textContent).not.toContain('Safety Score')
    })

    it('renders calculated scores when provided', () => {
      render(<FindingsScoresSection calculatedScores={{ stress_score: 78 }} />)
      expect(screen.getByText(/stress_score/i)).toBeInTheDocument()
      expect(screen.getByText('78')).toBeInTheDocument()
    })
  })

  describe('InterventionsSection', () => {
    it('renders empty state when interventions is empty array', () => {
      render(<InterventionsSection interventions={[]} />)
      expect(screen.getByText(/Keine Interventionen verfügbar/i)).toBeInTheDocument()
    })

    it('renders error state with evidence code when errorEvidenceCode is provided', () => {
      render(<InterventionsSection interventions={[]} errorEvidenceCode="E_QUERY_INTERVENTIONS" />)
      expect(screen.getByText(/Datenquelle aktuell nicht verfügbar/i)).toBeInTheDocument()
      expect(screen.getByText(/EVIDENCE: E_QUERY_INTERVENTIONS/i)).toBeInTheDocument()
    })

    it('renders data when interventions has items', () => {
      const interventions: RankedIntervention[] = [
        {
          rank: 1,
          topicId: 'breathing-exercises',
          topicLabel: 'Atemübungen',
          impactScore: 90,
          feasibilityScore: 85,
          priorityScore: 77,
        },
      ]
      render(<InterventionsSection interventions={interventions} />)
      expect(screen.getByText('Atemübungen')).toBeInTheDocument()
      expect(screen.getByText('77')).toBeInTheDocument() // priority score
    })
  })

  describe('Error Evidence Code Priority', () => {
    it('error state takes precedence over empty state in KeyLabsSection', () => {
      render(<KeyLabsSection labValues={[]} errorEvidenceCode="E_SCHEMA_DOCS" />)
      expect(screen.queryByText(/Keine Labordaten verfügbar/i)).not.toBeInTheDocument()
      expect(screen.getByText(/EVIDENCE: E_SCHEMA_DOCS/i)).toBeInTheDocument()
    })

    it('error state takes precedence over data in MedicationsSection', () => {
      const medications: Medication[] = [{ name: 'Test Med' }]
      render(<MedicationsSection medications={medications} errorEvidenceCode="E_RLS_DOCS" />)
      expect(screen.queryByText('Test Med')).not.toBeInTheDocument()
      expect(screen.getByText(/EVIDENCE: E_RLS_DOCS/i)).toBeInTheDocument()
    })
  })
})
