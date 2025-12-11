# B3 Navigation - Beispiel Integration

Dieses Dokument zeigt praktische Beispiele für die Integration der B3 Navigation API.

## Beispiel 1: Assessment Fortsetzen (Resume)

```typescript
'use client'

import { useEffect } from 'react'
import { useAssessmentResume } from '@/lib/hooks/useAssessmentNavigation'
import { useRouter } from 'next/navigation'

export default function ResumeAssessmentPage({ 
  params 
}: { 
  params: { assessmentId: string } 
}) {
  const { resumeData, status, error, load } = useAssessmentResume(params.assessmentId)
  const router = useRouter()

  useEffect(() => {
    load()
  }, [load])

  if (status === 'loading') {
    return <div>Assessment wird geladen...</div>
  }

  if (error) {
    return <div>Fehler: {error}</div>
  }

  if (!resumeData) {
    return null
  }

  // Nutze die resumeData zum Wiederherstellen des States
  return (
    <div>
      <h1>{resumeData.currentStep.title}</h1>
      <p>
        Sie haben bereits {resumeData.navigation.answeredQuestions} von{' '}
        {resumeData.navigation.totalQuestions} Fragen beantwortet.
      </p>
      
      {/* Stelle vorherige Antworten wieder her */}
      <pre>{JSON.stringify(resumeData.previousAnswers, null, 2)}</pre>
      
      <button onClick={() => router.push(`/assessment/${params.assessmentId}/step/${resumeData.currentStep.stepId}`)}>
        Fortfahren
      </button>
    </div>
  )
}
```

## Beispiel 2: Funnel Navigation mit Next/Previous

```typescript
'use client'

import { useAssessmentNavigation } from '@/lib/hooks/useAssessmentNavigation'
import { useRouter } from 'next/navigation'

export default function FunnelNavigationBar({ 
  assessmentId 
}: { 
  assessmentId: string 
}) {
  const { navigation, status, error, refresh, isNavigating } = 
    useAssessmentNavigation(assessmentId)
  
  const router = useRouter()

  if (status === 'loading') {
    return <div>Navigation lädt...</div>
  }

  if (error || !navigation) {
    return <div>Navigation nicht verfügbar</div>
  }

  const handlePrevious = () => {
    if (navigation.previousStepId) {
      router.push(`/assessment/${assessmentId}/step/${navigation.previousStepId}`)
    }
  }

  const handleNext = () => {
    if (navigation.nextStepId) {
      router.push(`/assessment/${assessmentId}/step/${navigation.nextStepId}`)
    }
  }

  return (
    <div className="flex justify-between items-center p-4 bg-white shadow">
      {/* Progress Bar */}
      <div className="flex-1">
        <div className="text-sm text-gray-600 mb-1">
          Schritt {navigation.currentStepIndex + 1} von {navigation.totalSteps}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${((navigation.currentStepIndex + 1) / navigation.totalSteps) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-2 ml-4">
        <button
          onClick={handlePrevious}
          disabled={!navigation.canGoPrevious || isNavigating}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Zurück
        </button>
        
        <button
          onClick={handleNext}
          disabled={!navigation.canGoNext || isNavigating}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {navigation.isComplete ? 'Abschließen' : 'Weiter'}
        </button>
      </div>
    </div>
  )
}
```

## Beispiel 3: Mobile Swipe Navigation mit Debouncing

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useSwipeable } from 'react-swipeable'
import { debouncedNavigationFetch } from '@/lib/navigation/debouncedFetch'
import { useRouter } from 'next/navigation'

export default function SwipeableFunnel({ 
  assessmentId,
  currentStepId 
}: { 
  assessmentId: string
  currentStepId: string 
}) {
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()

  const navigateToStep = async (direction: 'next' | 'prev') => {
    setIsNavigating(true)
    
    try {
      // Debounced fetch verhindert Race Conditions bei schnellen Swipes
      const response = await debouncedNavigationFetch(
        `swipe-nav-${assessmentId}`,
        `/api/assessments/${assessmentId}/navigation`,
        { method: 'GET' },
        100 // 100ms debounce
      )

      const result = await response.json()

      if (result.success && result.navigation) {
        const targetStepId = direction === 'next' 
          ? result.navigation.nextStepId 
          : result.navigation.previousStepId

        if (targetStepId) {
          router.push(`/assessment/${assessmentId}/step/${targetStepId}`)
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('superseded')) {
        // Request wurde durch neueren Request ersetzt - ignorieren
        console.log('Navigation request superseded')
        return
      }
      console.error('Navigation error:', error)
    } finally {
      setIsNavigating(false)
    }
  }

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => navigateToStep('next'),
    onSwipedRight: () => navigateToStep('prev'),
    preventScrollOnSwipe: true,
    trackMouse: true, // Für Desktop-Testing
  })

  return (
    <div {...swipeHandlers} className="relative h-full">
      {isNavigating && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-10">
          <div className="text-white">Navigiere...</div>
        </div>
      )}
      
      {/* Funnel Content */}
      <div className="p-4">
        <h2>Aktueller Schritt: {currentStepId}</h2>
        <p className="text-gray-500 mt-2">
          Swipe links für nächster Schritt, rechts für zurück
        </p>
      </div>
    </div>
  )
}
```

## Beispiel 4: Direct API Call (ohne Hook)

```typescript
// Für Server-Komponenten oder Custom Hooks

async function getAssessmentNavigationState(assessmentId: string) {
  try {
    const response = await fetch(`/api/assessments/${assessmentId}/navigation`)
    
    if (!response.ok) {
      throw new Error('Navigation konnte nicht geladen werden')
    }

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.error || 'Unbekannter Fehler')
    }

    return data.navigation
  } catch (error) {
    console.error('Error fetching navigation:', error)
    return null
  }
}

// Verwendung
const navigation = await getAssessmentNavigationState('assessment-uuid')
if (navigation) {
  console.log('Current step:', navigation.currentStepIndex)
  console.log('Can go next:', navigation.canGoNext)
  console.log('Progress:', `${navigation.answeredQuestions}/${navigation.totalQuestions}`)
}
```

## Beispiel 5: Validierung vor Navigation

```typescript
'use client'

import { useState } from 'react'
import { useAssessmentNavigation } from '@/lib/hooks/useAssessmentNavigation'

export default function ValidatedNavigation({ 
  assessmentId,
  currentAnswers 
}: { 
  assessmentId: string
  currentAnswers: Record<string, number>
}) {
  const { navigation } = useAssessmentNavigation(assessmentId)
  const [error, setError] = useState<string | null>(null)

  const handleNext = async () => {
    setError(null)

    // Lokale Validierung
    if (Object.keys(currentAnswers).length === 0) {
      setError('Bitte beantworten Sie mindestens eine Frage')
      return
    }

    // Server-Validierung
    try {
      const response = await fetch(`/api/assessments/${assessmentId}/navigation`)
      const result = await response.json()

      if (result.success && result.navigation.canGoNext) {
        // Navigation erlaubt
        window.location.href = `/assessment/${assessmentId}/step/${result.navigation.nextStepId}`
      } else {
        setError('Bitte beantworten Sie alle erforderlichen Fragen')
      }
    } catch (err) {
      setError('Fehler bei der Validierung')
    }
  }

  return (
    <div>
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <button 
        onClick={handleNext}
        disabled={!navigation?.canGoNext}
        className="px-6 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        Weiter
      </button>
    </div>
  )
}
```

## Performance Best Practices

### 1. Debouncing bei schneller Navigation

```typescript
import { debouncedNavigationFetch } from '@/lib/navigation/debouncedFetch'

// ✅ RICHTIG: Mit Debouncing
const response = await debouncedNavigationFetch(
  `nav-${assessmentId}`,
  `/api/assessments/${assessmentId}/navigation`,
  { method: 'GET' },
  100 // 100ms debounce
)

// ❌ FALSCH: Ohne Debouncing (Race Conditions möglich)
const response = await fetch(`/api/assessments/${assessmentId}/navigation`)
```

### 2. Hook Auto-Refresh

```typescript
// ✅ RICHTIG: Nach Antwort speichern
const { refresh } = useAssessmentNavigation(assessmentId)

const saveAnswer = async (questionId: string, value: number) => {
  await fetch('/api/assessment-answers/save', {
    method: 'POST',
    body: JSON.stringify({ assessmentId, questionId, answerValue: value })
  })
  
  // Navigation-Status aktualisieren
  await refresh()
}

// ❌ FALSCH: Navigation-Status wird nicht aktualisiert
const saveAnswer = async (questionId: string, value: number) => {
  await fetch('/api/assessment-answers/save', {
    method: 'POST',
    body: JSON.stringify({ assessmentId, questionId, answerValue: value })
  })
  // Navigation ist jetzt veraltet!
}
```

### 3. Cleanup bei Component Unmount

```typescript
import { clearPendingRequest } from '@/lib/navigation/debouncedFetch'

useEffect(() => {
  return () => {
    // Cleanup pending requests
    clearPendingRequest(`nav-${assessmentId}`)
  }
}, [assessmentId])
```

## Fehlerbehandlung

```typescript
const { navigation, status, error, retry } = useAssessmentNavigation(assessmentId)

if (status === 'error') {
  return (
    <div className="text-center p-8">
      <p className="text-red-600 mb-4">{error}</p>
      <button 
        onClick={() => retry()} 
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Erneut versuchen
      </button>
    </div>
  )
}
```

## Migration vom alten System

```typescript
// ALT: Lokaler State
const [currentStep, setCurrentStep] = useState(0)
const [canGoNext, setCanGoNext] = useState(false)

const handleNext = () => {
  if (currentStep < totalSteps - 1) {
    setCurrentStep(currentStep + 1)
  }
}

// NEU: Server-basiert
const { navigation } = useAssessmentNavigation(assessmentId)

const handleNext = () => {
  if (navigation?.nextStepId) {
    router.push(`/assessment/${assessmentId}/step/${navigation.nextStepId}`)
  }
}
```

## Testing

```typescript
// Mock für Tests
const mockNavigation = {
  currentStepId: 'step-1',
  currentStepIndex: 0,
  nextStepId: 'step-2',
  previousStepId: null,
  canGoNext: true,
  canGoPrevious: false,
  isComplete: false,
  totalSteps: 5,
  answeredQuestions: 3,
  totalQuestions: 15,
}

jest.mock('@/lib/hooks/useAssessmentNavigation', () => ({
  useAssessmentNavigation: () => ({
    navigation: mockNavigation,
    status: 'idle',
    error: null,
    refresh: jest.fn(),
    isNavigating: false,
  }),
}))
```
