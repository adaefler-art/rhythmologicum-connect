import 'server-only'

import { ErrorCode } from '@/lib/api/responseTypes'
import { sanitizeSupabaseError } from '@/lib/db/errors'
import { env } from '@/lib/env'

type RpcWhere = 'rpc_http' | 'rpc_db' | 'client_abort'

type RpcErrorPayload = {
  code?: string
  message?: string
  hint?: string
}

type RpcResult = {
  ok: boolean
  elapsedMs: number
  where: RpcWhere
  supabaseStatus: number | null
  errorCode?: ErrorCode
  errorMessage?: string
  data?: Array<{ missing_count?: number; missing_sample?: string[] }>
}

function isStatementTimeout(error: RpcErrorPayload | null): boolean {
  if (!error) return false
  const message = error.message?.toLowerCase() ?? ''
  return error.code === '57014' || message.includes('statement timeout')
}

function getRpcEndpointUrl(): string | null {
  const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  if (!baseUrl) return null
  return `${baseUrl.replace(/\/$/, '')}/rest/v1/rpc/meta_check_required_objects`
}

function getRpcApiKey(): string | null {
  return (
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    null
  )
}

async function parseJson<T>(response: Response): Promise<T | null> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export async function runRequiredObjectsRpc(
  requiredObjects: string[],
  timeoutMs: number,
): Promise<RpcResult> {
  const endpoint = getRpcEndpointUrl()
  const apiKey = getRpcApiKey()
  const startedAt = Date.now()

  if (!endpoint || !apiKey) {
    return {
      ok: false,
      elapsedMs: 0,
      where: 'rpc_http',
      supabaseStatus: null,
      errorCode: ErrorCode.CONFIGURATION_ERROR,
      errorMessage: 'Supabase configuration missing for RPC probe',
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: apiKey,
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ required_objects: requiredObjects }),
      signal: controller.signal,
    })

    const elapsedMs = Date.now() - startedAt
    const supabaseStatus = response.status

    if (response.ok) {
      const data = await parseJson<Array<{ missing_count?: number; missing_sample?: string[] }>>(
        response,
      )
      return {
        ok: true,
        elapsedMs,
        where: 'rpc_http',
        supabaseStatus,
        data: data ?? undefined,
      }
    }

    const errorPayload = await parseJson<RpcErrorPayload>(response)
    const errorMessage = errorPayload?.message ?? 'RPC error'

    if (isStatementTimeout(errorPayload)) {
      return {
        ok: false,
        elapsedMs,
        where: 'rpc_db',
        supabaseStatus,
        errorCode: ErrorCode.SCHEMA_MIGRATION_CHECK_TIMEOUT,
        errorMessage,
      }
    }

    return {
      ok: false,
      elapsedMs,
      where: 'rpc_db',
      supabaseStatus,
      errorCode: ErrorCode.SCHEMA_RPC_ERROR,
      errorMessage,
    }
  } catch (error) {
    const elapsedMs = Date.now() - startedAt

    if ((error as { name?: string }).name === 'AbortError') {
      return {
        ok: false,
        elapsedMs,
        where: 'client_abort',
        supabaseStatus: null,
        errorCode: ErrorCode.SCHEMA_RPC_TIMEOUT,
        errorMessage: 'RPC request timed out',
      }
    }

    const safeError = sanitizeSupabaseError(error)
    return {
      ok: false,
      elapsedMs,
      where: 'rpc_http',
      supabaseStatus: null,
      errorCode: ErrorCode.SCHEMA_RPC_ERROR,
      errorMessage: safeError.message,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}
