
import { request } from './client'

export type SourceSyncResult = {
  source_id: string
  source_name: string
  status: 'updated' | 'not_modified' | 'error'
  entries_count: number
  error: string | null
}

export type FeedSyncResponse = {
  total_sources: number
  successful_sources: number
  failed_sources: number
  total_entries_found: number
  results: SourceSyncResult[]
}

export type FeedSyncParams = {
  category_id?: string
  source_id?: string
}

export function syncFeeds(params: FeedSyncParams) {
  return request<FeedSyncResponse>('/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
}
