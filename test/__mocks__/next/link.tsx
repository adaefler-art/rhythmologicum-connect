/**
 * Mock for next/link (testing purposes)
 */

import React from 'react'

type LinkProps = {
  href: string
  children: React.ReactNode
  className?: string
  [key: string]: any
}

const Link = ({ href, children, ...props }: LinkProps) => {
  return React.createElement('a', { href, ...props }, children)
}

export default Link
