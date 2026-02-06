import { useEffect, useMemo, useState } from 'react'
import { Card, Badge } from '@/lib/ui'
import { Brain, MessageCircle } from 'lucide-react'
import { getClinicianApiUrl } from './clinicianApi'

type AmyMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
}

type Conversation = {
  id: string
  timestamp: string
  channel: string
  summary: string
  messages: AmyMessage[]
}

type AmyInsightsSectionProps = {
  patientId: string
  isEnabled?: boolean
}

const formatDate = (isoString: string): string => {
  try {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoString))
  } catch {
    return 'Datum unbekannt'
  }
}

const getRoleLabel = (role: AmyMessage['role']) => {
  if (role === 'assistant') return 'AMY'
  if (role === 'user') return 'Patient:in'
  return 'System'
}

const isEmptyMessage = (message: AmyMessage) => message.content.trim().length === 0

export function AmyInsightsSection({ patientId, isEnabled = true }: AmyInsightsSectionProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      if (!isEnabled) {
        setConversations([])
        setSelectedId(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(getClinicianApiUrl(patientId, 'amy-insights'))
        if (!response.ok) {
          if (!isMounted) return
          setError('AMY-Konversationen konnten nicht geladen werden.')
          setConversations([])
          setSelectedId(null)
          return
        }

        const data = await response.json()
        if (!isMounted) return

        const loaded = (data?.data?.conversations || []) as Conversation[]
        setConversations(loaded)
        setSelectedId(loaded[0]?.id ?? null)
      } catch (err) {
        if (!isMounted) return
        console.error('[AmyInsightsSection] Fetch error:', err)
        setError('AMY-Konversationen konnten nicht geladen werden.')
        setConversations([])
        setSelectedId(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [patientId, isEnabled])

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) || null,
    [conversations, selectedId],
  )

  if (isLoading) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            AMY Insights
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">AMY-Konversationen werden geladen…</p>
      </Card>
    )
  }

  if (!isEnabled || conversations.length === 0) {
    return (
      <Card padding="lg" shadow="md">
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Keine AMY-Konversationen vorhanden
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {!isEnabled
              ? 'AMY-Chat ist derzeit deaktiviert.'
              : error || 'Für diese:n Patient:in liegen noch keine AMY-Konversationen vor.'}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="lg" shadow="md">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">AMY Insights</h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => setSelectedId(conversation.id)}
              className={`w-full text-left rounded-lg border px-3 py-3 transition-colors ${
                conversation.id === selectedId
                  ? 'border-purple-400 bg-purple-50/60 dark:bg-purple-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-purple-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(conversation.timestamp)}
                </span>
                <Badge variant="secondary" size="sm">
                  {conversation.channel}
                </Badge>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200 mt-2">
                {conversation.summary || 'Keine Zusammenfassung verfügbar.'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {conversation.messages.length} Nachrichten
              </p>
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4">
          {selectedConversation ? (
            <>
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Thread-Details
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(selectedConversation.timestamp)}
                  </p>
                </div>
                <MessageCircle className="w-5 h-5 text-slate-400" />
              </div>

              <div className="space-y-3">
                {selectedConversation.messages
                  .filter((message) => message.role !== 'system')
                  .filter((message) => !isEmptyMessage(message))
                  .map((message) => (
                    <div
                      key={message.id}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        message.role === 'assistant'
                          ? 'border-purple-200 bg-purple-50/60 dark:border-purple-800 dark:bg-purple-900/20'
                          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                        <span>{getRoleLabel(message.role)}</span>
                        <span>{formatDate(message.created_at)}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10">
              <MessageCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Keine Konversation ausgewaehlt.</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
