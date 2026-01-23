import type { ReactNode } from 'react'

type StandardContentContainerProps = {
  children: ReactNode
  className?: string
}

export default function StandardContentContainer({
  children,
  className = '',
}: StandardContentContainerProps) {
  return (
    <div
      className={`mx-auto flex w-full max-w-6xl flex-col px-4 ${className}`.trim()}
    >
      {children}
    </div>
  )
}
