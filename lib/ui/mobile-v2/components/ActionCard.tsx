'use client'

import React from 'react'
import { Card } from '@/lib/ui/mobile-v2/components/Card'
import { Button } from '@/lib/ui/mobile-v2/components/Button'
import { Action } from '@/lib/ui/mobile-v2/types'
import { ArrowRight, Download, Video, Calendar, MessageCircle } from 'lucide-react'

interface ActionCardProps {
  action: Action
  onAction?: () => void
}

export function ActionCard({ action, onAction }: ActionCardProps) {
  const getIcon = () => {
    const iconMap: Record<string, React.ReactNode> = {
      download: <Download className="w-5 h-5" />,
      video: <Video className="w-5 h-5" />,
      calendar: <Calendar className="w-5 h-5" />,
      message: <MessageCircle className="w-5 h-5" />,
    }
    return iconMap[action.icon] || null
  }
  
  const getButtonVariant = () => {
    const variantMap: Record<string, any> = {
      primary: 'primary',
      success: 'success',
      warning: 'warning',
      secondary: 'outline',
    }
    return variantMap[action.type] || 'primary'
  }
  
  return (
    <Card padding="md" shadow="sm" hover={!action.disabled}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${action.iconBgColor} ${action.disabled ? 'opacity-50' : ''}`}>
          <span className={action.iconColor}>
            {getIcon()}
          </span>
        </div>
        
        <div className="flex-1">
          <h4 className={`text-base font-semibold mb-1 ${action.disabled ? 'text-[#9ca3af]' : 'text-[#1f2937]'}`}>
            {action.title}
          </h4>
          <p className={`text-sm ${action.disabled ? 'text-[#d1d5db]' : 'text-[#6b7280]'}`}>
            {action.description}
          </p>
          {action.disabled && action.disabledReason && (
            <p className="text-xs text-[#f59e0b] mt-1 font-medium">
              {action.disabledReason}
            </p>
          )}
        </div>
      </div>
      
      {action.buttonText && (
        <Button
          variant={getButtonVariant()}
          size="sm"
          fullWidth
          onClick={onAction}
          disabled={action.disabled}
          icon={<ArrowRight className="w-4 h-4" />}
          iconPosition="right"
        >
          {action.buttonText}
        </Button>
      )}
    </Card>
  )
}
