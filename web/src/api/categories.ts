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

export function updateCategory(id: string, name: string) {
  return request<Category>(`/categories/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  })
}

export function deleteCategory(id: string) {
  return request<void>(`/categories/${id}`, {
    method: 'DELETE',
  })
}