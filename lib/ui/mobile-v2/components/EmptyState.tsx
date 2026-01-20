'use client'

import React from 'react'
import { Card } from '@/lib/ui/mobile-v2/components/Card'
import { Button } from '@/lib/ui/mobile-v2/components/Button'
import { LucideIcon, Inbox, FileQuestion, Search, AlertCircle } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  iconVariant?: 'inbox' | 'search' | 'question' | 'alert'
  title: string
  message: string
  ctaText?: string
  onCtaClick?: () => void
  className?: string
}

export function EmptyState({
  icon: CustomIcon,
  iconVariant = 'inbox',
  title,
  message,
  ctaText,
  onCtaClick,
  className = '',
}: EmptyStateProps) {
  const getDefaultIcon = () => {
    const iconMap: Record<string, LucideIcon> = {
      inbox: Inbox,
      search: Search,
      question: FileQuestion,
      alert: AlertCircle,
    }
    return iconMap[iconVariant] || Inbox
  }
  
  const Icon = CustomIcon || getDefaultIcon()
  
  return (
    <Card padding="lg" shadow="none" className={`bg-[#f9fafb] ${className}`}>
      <div className="flex flex-col items-center justify-center text-center py-8 px-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#f3f4f6] mb-4">
          <Icon className="w-8 h-8 text-[#9ca3af]" />
        </div>
        
        <h3 className="text-lg font-semibold text-[#1f2937] mb-2">
          {title}
        </h3>
        
        <p className="text-sm text-[#6b7280] mb-6 max-w-sm leading-relaxed">
          {message}
        </p>
        
        {ctaText && onCtaClick && (
          <Button
            variant="primary"
            size="md"
            onClick={onCtaClick}
          >
            {ctaText}
          </Button>
        )}
      </div>
    </Card>
  )
}
