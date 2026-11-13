import { request } from './client'

export type Article = {
  id: string
  source_id: string
  title: string
  url: string | null
  published_at: string | null
  created_at: string
  is_read: boolean
  is_starred: boolean
}

export type ArticleDetail = Article & {
  normalized_url: string | null
  content: string | null
  author: string | null
}

export type ArticleListResponse = {
  items: Article[]
  limit: number
  offset: number
  has_more: boolean
}

export type ArticleListParams = {
  limit?: number
  offset?: number
  source_id?: string
  category_id?: string
  is_read?: boolean
  is_starred?: boolean
}

export function listArticles(params: ArticleListParams = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      query.set(key, String(value))
    }
  })

  const queryString = query.toString()

  return request<ArticleListResponse>(
    `/articles${queryString ? `?${queryString}` : ''}`,
  )
}

export function updateArticle(
  id: string,
  changes: Partial<Pick<Article, 'is_read' | 'is_starred'>>,
) {
  return request<Article>(`/articles/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  })
}

export function getArticle(id: string) {
  return request<ArticleDetail>(`/articles/${id}`)
}
