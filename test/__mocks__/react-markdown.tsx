/**
 * Mock for react-markdown (testing purposes)
 */

import React from 'react'

const ReactMarkdown = ({ children }: { children: string }) => {
  return React.createElement('div', { className: 'markdown-content' }, children)
}

export default ReactMarkdown
