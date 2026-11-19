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

export function updateSource(
  id: string,
  changes: Partial<Pick<Source, 'name' | 'category_id'>>,
) {
  return request<Source>(`/sources/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(changes),
  })
}

export function deleteSource(id: string) {
  return request<void>(`/sources/${id}`, {
    method: 'DELETE',
  })
}