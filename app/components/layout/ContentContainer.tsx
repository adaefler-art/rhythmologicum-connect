import type { ReactNode } from 'react'

type ContentContainerProps = {
  children: ReactNode
  className?: string
}

export default function ContentContainer({ children, className = '' }: ContentContainerProps) {
  return <div className={`mx-auto w-full max-w-4xl ${className}`.trim()}>{children}</div>
}
