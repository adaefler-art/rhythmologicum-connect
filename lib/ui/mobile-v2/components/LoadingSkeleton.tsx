'use client'

import React from 'react'

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'text' | 'circle'
  count?: number
  className?: string
}

export function LoadingSkeleton({ variant = 'card', count = 1, className = '' }: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i)
  
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={`bg-white rounded-2xl p-4 shadow-sm ${className}`}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#f3f4f6] animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#f3f4f6] rounded animate-pulse w-2/3" />
                <div className="h-3 bg-[#f3f4f6] rounded animate-pulse w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-[#f3f4f6] rounded animate-pulse" />
              <div className="h-3 bg-[#f3f4f6] rounded animate-pulse w-5/6" />
            </div>
          </div>
        )
      
      case 'list':
        return (
          <div className={`bg-white rounded-2xl p-4 shadow-sm ${className}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#f3f4f6] animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#f3f4f6] rounded animate-pulse w-3/4" />
                <div className="h-3 bg-[#f3f4f6] rounded animate-pulse w-1/2" />
              </div>
              <div className="w-5 h-5 bg-[#f3f4f6] rounded animate-pulse flex-shrink-0" />
            </div>
          </div>
        )
      
      case 'text':
        return (
          <div className={`space-y-2 ${className}`}>
            <div className="h-4 bg-[#f3f4f6] rounded animate-pulse w-full" />
            <div className="h-4 bg-[#f3f4f6] rounded animate-pulse w-5/6" />
            <div className="h-4 bg-[#f3f4f6] rounded animate-pulse w-4/6" />
          </div>
        )
      
      case 'circle':
        return (
          <div className={`flex items-center gap-3 ${className}`}>
            <div className="w-12 h-12 rounded-full bg-[#f3f4f6] animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#f3f4f6] rounded animate-pulse w-2/3" />
              <div className="h-3 bg-[#f3f4f6] rounded animate-pulse w-1/2" />
            </div>
          </div>
        )
      
      default:
        return null
    }
  }
  
  return (
    <div className="space-y-4">
      {skeletons.map((i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  )
}
