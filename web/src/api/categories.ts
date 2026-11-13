import { request } from './client'

export type Category = {
  id: string
  name: string
}

export function listCategories() {
  return request<Category[]>('/categories')
}

export function createCategory(name: string) {
  return request<Category>('/categories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  })
}