'use client'

import React from 'react'
import { Card } from '@/lib/ui/mobile-v2/components/Card'
import { Badge } from '@/lib/ui/mobile-v2/components/Badge'
import { Calendar, Clock } from 'lucide-react'
import { Appointment } from '@/lib/ui/mobile-v2/types'

interface AppointmentCardProps {
  appointment: Appointment
  onClick?: () => void
}

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
  return (
    <Card padding="md" shadow="sm" hover onClick={onClick}>
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#fef9c3]">
          <Calendar className="w-5 h-5 text-[#eab308]" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="text-sm font-semibold text-[#1f2937] mb-1">
                {appointment.title}
              </h4>
              <p className="text-xs text-[#6b7280]">{appointment.subtitle}</p>
            </div>
            <Badge variant="warning" size="sm">
              {appointment.type}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
              <Calendar className="w-3.5 h-3.5" />
              <span>{appointment.date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
              <Clock className="w-3.5 h-3.5" />
              <span>{appointment.time}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
