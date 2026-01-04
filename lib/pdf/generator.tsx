/**
 * PDF Generator - V05-I05.8
 * 
 * Generates PDF from report sections using @react-pdf/renderer.
 * Ensures deterministic output and PHI-free content.
 * 
 * @module lib/pdf/generator
 */

import React from 'react'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ReportSectionsV1 } from '@/lib/contracts/reportSections'
import type { PdfGenerationInput, PdfMetadata } from '@/lib/contracts/pdfGeneration'
import { computePdfHash } from './storage'

// PDF version for tracking algorithm changes
const PDF_VERSION = 'v1.0.0'

/**
 * PDF Styles
 * Consistent styling for report PDF
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  sectionContent: {
    fontSize: 11,
    lineHeight: 1.6,
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#999999',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 5,
  },
  disclaimer: {
    marginTop: 30,
    padding: 10,
    backgroundColor: '#f5f5f5',
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    fontSize: 8,
    color: '#999999',
  },
})

/**
 * Maps section key to human-readable title
 */
const SECTION_TITLES: Record<string, string> = {
  overview: 'Überblick',
  findings: 'Befunde',
  recommendations: 'Empfehlungen',
  risk_summary: 'Risikozusammenfassung',
  top_interventions: 'Top-Interventionen',
}

/**
 * React PDF Document Component
 */
interface ReportPdfDocumentProps {
  sections: ReportSectionsV1
  patientData?: PdfGenerationInput['patientData']
  options: PdfGenerationInput['options']
}

function ReportPdfDocument({ sections, patientData, options }: ReportPdfDocumentProps) {
  const generatedDate = new Date(sections.generatedAt).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Stress- und Resilienz-Assessment Report</Text>
          {patientData?.initials && (
            <Text style={styles.subtitle}>Initialen: {patientData.initials}</Text>
          )}
          {patientData?.assessmentDate && (
            <Text style={styles.subtitle}>
              Assessment-Datum:{' '}
              {new Date(patientData.assessmentDate).toLocaleDateString('de-DE')}
            </Text>
          )}
          {options.includeTimestamp && (
            <Text style={styles.subtitle}>Erstellt: {generatedDate}</Text>
          )}
        </View>

        {/* Report Sections */}
        {sections.sections.map((section, index) => (
          <View key={`${section.sectionKey}-${index}`} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {SECTION_TITLES[section.sectionKey] || section.sectionKey}
            </Text>
            <Text style={styles.sectionContent}>{section.draft}</Text>
          </View>
        ))}

        {/* Disclaimer */}
        {options.includeDisclaimer && (
          <View style={styles.disclaimer}>
            <Text>
              Dieser Bericht wurde automatisch auf Basis Ihrer Assessment-Antworten erstellt. Die
              Informationen dienen nur zu Informationszwecken und ersetzen keine professionelle
              medizinische Beratung, Diagnose oder Behandlung. Wenden Sie sich bei gesundheitlichen
              Fragen immer an Ihren Arzt oder einen anderen qualifizierten Gesundheitsdienstleister.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Rhythmologicum Connect • Vertraulich</Text>
          {options.includeTimestamp && <Text>Generiert: {generatedDate}</Text>}
        </View>

        {/* Page Numbers */}
        {options.includePageNumbers && (
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`}
            fixed
          />
        )}
      </Page>
    </Document>
  )
}

/**
 * Generates PDF from report sections
 * 
 * @param input - PDF generation input
 * @returns PDF buffer and metadata
 */
export async function generatePdf(input: PdfGenerationInput): Promise<{
  success: boolean
  buffer?: Buffer
  metadata?: PdfMetadata
  error?: string
}> {
  try {
    const startTime = Date.now()

    // Validate input has sections
    const sections = input.sectionsData as ReportSectionsV1
    if (!sections || !sections.sections || sections.sections.length === 0) {
      return {
        success: false,
        error: 'No report sections provided',
      }
    }

    // Render to buffer
    const pdfBuffer = await renderToBuffer(
      <ReportPdfDocument
        sections={sections}
        patientData={input.patientData}
        options={input.options}
      />,
    )

    // Convert Uint8Array to Buffer if needed
    const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer)

    // Compute hash for determinism verification
    const contentHash = computePdfHash(buffer)

    // Count pages (simple heuristic based on buffer size and content)
    // For accurate page counting, we'd need to parse the PDF, but this is a reasonable estimate
    const estimatedPageCount = Math.max(1, Math.ceil(sections.sections.length / 3))

    // Build metadata
    const metadata: PdfMetadata = {
      fileSizeBytes: buffer.length,
      generatedAt: new Date().toISOString(),
      version: PDF_VERSION,
      contentHash,
      pageCount: estimatedPageCount,
      sectionsVersion: sections.sectionsVersion,
    }

    const generationTimeMs = Date.now() - startTime

    console.log('[PDF_GENERATED]', {
      jobId: input.jobId,
      assessmentId: input.assessmentId,
      fileSizeBytes: metadata.fileSizeBytes,
      pageCount: metadata.pageCount,
      generationTimeMs,
      contentHash,
    })

    return {
      success: true,
      buffer,
      metadata,
    }
  } catch (error) {
    console.error('[PDF_GENERATION_FAILED]', {
      jobId: input.jobId,
      assessmentId: input.assessmentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown PDF generation error',
    }
  }
}

/**
 * Validates PDF buffer
 * Checks if buffer starts with PDF magic bytes
 */
export function isValidPdfBuffer(buffer: Buffer): boolean {
  // PDF files must start with "%PDF-"
  const pdfMagicBytes = Buffer.from('%PDF-')
  return buffer.length > 4 && buffer.subarray(0, 5).equals(pdfMagicBytes)
}
