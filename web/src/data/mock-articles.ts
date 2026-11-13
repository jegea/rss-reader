import type { Feed } from './mock-data'

export type Article = {
  id: string
  title: string
  summary: string
  url: string
  feedId: Feed['id']
  publishedAt: string
  isRead: boolean
}

export const mockArticles: Article[] = [
  {
    id: 'article-1',
    title: 'The next chapter of artificial intelligence',
    summary:
      'A look at how AI products are evolving and what the next generation of tools could mean for software development.',
    url: 'https://example.com/articles/ai-next-chapter',
    feedId: 'techcrunch',
    publishedAt: '2026-10-29T09:30:00Z',
    isRead: false,
  },
  {
    id: 'article-2',
    title: 'Why the web platform still matters',
    summary:
      'Modern web applications continue to benefit from open standards, browser capabilities and a rapidly evolving ecosystem.',
    url: 'https://example.com/articles/web-platform',
    feedId: 'the-verge',
    publishedAt: '2026-10-29T08:15:00Z',
    isRead: false,
  },
  {
    id: 'article-3',
    title: 'New discoveries reshape our understanding of space',
    summary:
      'Researchers have published new observations that could help answer longstanding questions about the universe.',
    url: 'https://example.com/articles/space-discoveries',
    feedId: 'science-daily',
    publishedAt: '2026-10-28T16:45:00Z',
    isRead: true,
  },
  {
    id: 'article-4',
    title: 'Building better software with smaller teams',
    summary:
      'A practical look at engineering practices, team autonomy and the decisions that help small teams deliver reliable products.',
    url: 'https://example.com/articles/small-teams',
    feedId: 'techcrunch',
    publishedAt: '2026-10-28T11:20:00Z',
    isRead: false,
  },
  {
    id: 'article-5',
    title: 'Notes on building independent products',
    summary:
      'Lessons from developing software products, talking to users and deciding which ideas deserve more time.',
    url: 'https://example.com/articles/independent-products',
    feedId: 'personal-blog',
    publishedAt: '2026-10-27T14:00:00Z',
    isRead: true,
  },
]