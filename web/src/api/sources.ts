import { request } from './client'

export type Source = {
  id: string
  name: string
  url: string
  category_id: string | null
}

export function listSources() {
  return request<Source[]>('/sources')
}

export function createSource(
  url: string,
  categoryId: string | null,
) {
  return request<Source>('/sources', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      category_id: categoryId,
    }),
  })
}