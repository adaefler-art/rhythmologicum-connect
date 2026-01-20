'use client'

import React from 'react'
import { Card } from '@/lib/ui/mobile-v2/components/Card'
import { Button } from '@/lib/ui/mobile-v2/components/Button'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message: string
  retryText?: string
  onRetry?: () => void
  showIcon?: boolean
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  retryText = 'Try again',
  onRetry,
  showIcon = true,
  className = '',
}: ErrorStateProps) {
  return (
    <Card padding="lg" shadow="sm" className={`border-2 border-[#fee2e2] bg-[#fef2f2] ${className}`}>
      <div className="flex flex-col items-center justify-center text-center py-6 px-4">
        {showIcon && (
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#fee2e2] mb-4">
            <AlertCircle className="w-8 h-8 text-[#ef4444]" />
          </div>
        )}
        
        <h3 className="text-lg font-semibold text-[#991b1b] mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-[#7f1d1d] mb-6 max-w-sm leading-relaxed">
          {message}
        </p>
        
        {onRetry && (
          <Button
            variant="primary"
            size="md"
            onClick={onRetry}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            {retryText}
          </Button>
        )}
      </div>
    </Card>
  )
}
