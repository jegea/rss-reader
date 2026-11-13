export type Feed = {
  id: string
  name: string
  categoryId: string | null
}

export type FeedCategory = {
  id: string
  name: string
}

export const mockCategories: FeedCategory[] = [
  { id: 'technology', name: 'Tecnología' },
  { id: 'science', name: 'Ciencia' },
  { id: 'business', name: 'Negocios' },
]

export const mockFeeds: Feed[] = [
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    categoryId: 'technology',
  },
  {
    id: 'the-verge',
    name: 'The Verge',
    categoryId: 'technology',
  },
  {
    id: 'science-daily',
    name: 'ScienceDaily',
    categoryId: 'science',
  },
  {
    id: 'personal-blog',
    name: 'Blog personal',
    categoryId: null,
  },
]