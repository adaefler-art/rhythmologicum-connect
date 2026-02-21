import { parseContentBlocks } from '@/lib/contracts/contentBlocks'
import type { ContentPage } from '@/lib/types/content'

export function withValidatedContentBlocks<T extends ContentPage>(record: T): T {
  const rawBlocks = (record as unknown as { blocks?: unknown }).blocks
  const blocks = parseContentBlocks(rawBlocks)

  return {
    ...record,
    blocks: blocks ?? null,
  }
}

export function withValidatedContentBlocksList<T extends ContentPage>(records: T[]): T[] {
  return records.map((record) => withValidatedContentBlocks(record))
}
