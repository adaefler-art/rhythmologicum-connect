'use client'

/**
 * Example Component Using Design Token Context
 * 
 * V05-I09.2: Demonstrates how to consume design tokens from context
 * with organization-specific overrides.
 */

import { useDesignTokens } from '@/lib/contexts/DesignTokensContext'

export function ExampleTokenConsumer() {
  // Access tokens from context - these will include organization overrides
  const { spacing, colors, typography, radii } = useDesignTokens()

  return (
    <div
      style={{
        padding: spacing.lg,
        backgroundColor: colors.primary[50],
        borderRadius: radii.lg,
        border: `2px solid ${colors.primary[200]}`,
      }}
    >
      <h2
        style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.primary[900],
          marginBottom: spacing.md,
        }}
      >
        Design Token Example
      </h2>
      
      <p
        style={{
          fontSize: typography.fontSize.base,
          lineHeight: typography.lineHeight.relaxed,
          color: colors.neutral[700],
        }}
      >
        This component uses design tokens from the context. If your organization has custom
        token overrides, they will be reflected here automatically.
      </p>

      <div style={{ marginTop: spacing.lg }}>
        <button
          style={{
            padding: `${spacing.sm} ${spacing.lg}`,
            backgroundColor: colors.primary[500],
            color: '#ffffff',
            borderRadius: radii.md,
            border: 'none',
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
            cursor: 'pointer',
          }}
        >
          Button with Context Tokens
        </button>
      </div>

      <div style={{ marginTop: spacing.lg, fontSize: typography.fontSize.sm }}>
        <details>
          <summary style={{ cursor: 'pointer', color: colors.neutral[600] }}>
            View Current Token Values
          </summary>
          <pre
            style={{
              marginTop: spacing.md,
              padding: spacing.md,
              backgroundColor: colors.neutral[100],
              borderRadius: radii.sm,
              fontSize: typography.fontSize.xs,
              overflow: 'auto',
            }}
          >
            {JSON.stringify(
              {
                'spacing.lg': spacing.lg,
                'colors.primary.500': colors.primary[500],
                'typography.fontSize.base': typography.fontSize.base,
                'radii.lg': radii.lg,
              },
              null,
              2
            )}
          </pre>
        </details>
      </div>
    </div>
  )
}
