/**
 * Mock for react-markdown (testing purposes)
 * 
 * V05-I06.2 Hardening: Support components prop for link rendering
 */

import React from 'react'

type ReactMarkdownProps = {
  children: string
  skipHtml?: boolean
  remarkPlugins?: any[]
  components?: {
    a?: React.ComponentType<any>
    [key: string]: React.ComponentType<any> | undefined
  }
}

const ReactMarkdown = ({ children, components }: ReactMarkdownProps) => {
  // Parse markdown links for testing
  // This is a simplified mock that handles basic markdown links
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match

  while ((match = linkRegex.exec(children)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(children.substring(lastIndex, match.index))
    }

    // Create link element
    const linkText = match[1]
    const href = match[2]

    if (components?.a) {
      const LinkComponent = components.a
      parts.push(
        React.createElement(
          LinkComponent,
          { key: match.index, href },
          linkText
        )
      )
    } else {
      parts.push(
        React.createElement('a', { key: match.index, href }, linkText)
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < children.length) {
    parts.push(children.substring(lastIndex))
  }

  return React.createElement(
    'div',
    { className: 'markdown-content' },
    parts.length > 0 ? parts : children
  )
}

export default ReactMarkdown
