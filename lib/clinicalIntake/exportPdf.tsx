import React from 'react'
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { ClinicalIntakeExportPayload } from '@/lib/clinicalIntake/exportPayload'

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontSize: 10,
    lineHeight: 1.4,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 700,
  },
  section: {
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 11,
    marginBottom: 4,
    fontWeight: 700,
  },
  row: {
    marginBottom: 2,
  },
  muted: {
    color: '#475569',
  },
  listItem: {
    marginLeft: 8,
    marginBottom: 2,
  },
})

const renderList = (items: string[]) => {
  if (items.length === 0) {
    return <Text style={styles.muted}>-</Text>
  }

  return items.map((item, index) => (
    <Text key={`${item}-${index}`} style={styles.listItem}>
      • {item}
    </Text>
  ))
}

const IntakeSummaryDocument = ({ data }: { data: ClinicalIntakeExportPayload }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Intake Summary Report</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Metadata</Text>
        <Text style={styles.row}>Patient Ref: {data.metadata.patient_ref}</Text>
        <Text style={styles.row}>Intake Version: v{data.metadata.intake_version}</Text>
        <Text style={styles.row}>Generated At: {data.metadata.generated_at}</Text>
        <Text style={styles.row}>Created: {data.metadata.created_at}</Text>
        <Text style={styles.row}>Updated: {data.metadata.updated_at}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Clinical Summary</Text>
        <Text>{data.clinical_summary || '-'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Structured Highlights</Text>
        <Text style={styles.row}>Chief Complaint: {data.structured_highlights.chief_complaint || '-'}</Text>
        <Text style={styles.row}>Timeline</Text>
        {renderList(data.structured_highlights.timeline)}
        <Text style={styles.row}>History</Text>
        {renderList(data.structured_highlights.history)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety</Text>
        <Text style={styles.row}>
          Effective Policy: {data.safety.effective_policy_result.escalation_level || 'None'} /{' '}
          {data.safety.effective_policy_result.chat_action || 'none'}
        </Text>
        <Text style={styles.row}>Triggered Rules:</Text>
        {data.safety.triggered_rules.length === 0 ? (
          <Text style={styles.muted}>-</Text>
        ) : (
          data.safety.triggered_rules.map((rule, index) => (
            <View key={`${rule.rule_id}-${index}`} style={{ marginBottom: 3 }}>
              <Text style={styles.listItem}>
                • {rule.rule_id} ({rule.level}) {rule.short_reason}
              </Text>
              {rule.excerpts.slice(0, 2).map((excerpt, excerptIndex) => (
                <Text key={`${rule.rule_id}-ex-${excerptIndex}`} style={{ marginLeft: 14 }}>
                  - {excerpt.source}: {excerpt.excerpt}
                </Text>
              ))}
            </View>
          ))
        )}
        {data.safety.policy_override_audit.length > 0 && (
          <Text style={styles.row}>
            Override: {data.safety.policy_override_audit[0].override_level || '-'} /{' '}
            {data.safety.policy_override_audit[0].override_action || '-'}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Review</Text>
        <Text style={styles.row}>Status: {data.review.current?.status || '-'}</Text>
        <Text style={styles.row}>Notes: {data.review.current?.review_notes || '-'}</Text>
        <Text style={styles.row}>Requested Items</Text>
        {renderList(data.review.current?.requested_items ?? [])}
        <Text style={styles.row}>Audit Entries: {data.review.audit.length}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audit + Attachments</Text>
        <Text style={styles.row}>Reviewer identities: {data.audit.reviewer_identities.join(', ') || '-'}</Text>
        <Text style={styles.row}>Message refs: {data.attachments.message_refs.join(', ') || '-'}</Text>
        <Text style={styles.row}>Evidence refs: {data.attachments.evidence_refs.join(', ') || '-'}</Text>
      </View>
    </Page>
  </Document>
)

export const renderClinicalIntakeSummaryPdf = async (data: ClinicalIntakeExportPayload) => {
  return renderToBuffer(<IntakeSummaryDocument data={data} />)
}
