'use client'

import React from 'react'
import { Card } from '@/lib/ui/mobile-v2/components/Card'
import { WeeklyData } from '@/lib/ui/mobile-v2/types'

interface WeeklyChartProps {
  title: string
  data: WeeklyData[]
  color?: string
  onViewAll?: () => void
}

export function WeeklyChart({ title, data, color = 'purple', onViewAll }: WeeklyChartProps) {
  const maxValue = Math.max(...data.map(d => d.value))
  
  const colorMap: Record<string, { bar: string; text: string }> = {
    purple: { bar: 'bg-[#a855f7]', text: 'text-[#a855f7]' },
    blue: { bar: 'bg-[#4a90e2]', text: 'text-[#4a90e2]' },
    green: { bar: 'bg-[#5cb85c]', text: 'text-[#5cb85c]' },
  }
  
  const colors = colorMap[color] || colorMap.purple
  
  return (
    <Card padding="md" shadow="sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-[#1f2937]">{title}</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm font-medium text-[#4a90e2] hover:text-[#3b82f6]"
          >
            View all
          </button>
        )}
      </div>
      
      <div className="flex items-end justify-between gap-2 h-24">
        {data.map((item, index) => {
          const height = (item.value / maxValue) * 100
          return (
            <div key={index} className="flex flex-col items-center gap-2 flex-1">
              <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                <div
                  className={`w-full rounded-t-md ${colors.bar} transition-all duration-300`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-xs text-[#9ca3af] font-medium">{item.day}</span>
            </div>
          )
        })}
      </div>
      
      <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
        <p className="text-xs text-[#6b7280]">Active time throughout the week</p>
      </div>
    </Card>
  )
}
