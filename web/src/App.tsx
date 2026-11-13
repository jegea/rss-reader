import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import ArticleList from './components/articles/ArticleList'
import MainLayout from './components/layout/MainLayout'
import {
  listArticles,
  updateArticle,
  type Article,
  type ArticleListParams,
} from './api/articles'
import {
  createCategory,
  listCategories,
  type Category,
} from './api/categories'
import {
  createSource,
  listSources,
  type Source,
} from './api/sources'

const PAGE_SIZE = 30

type ArticlePage = {
  filterKey: string
  items: Article[]
  nextOffset: number
  hasMore: boolean
  error: string | null
}

function App() {
  const [selectedItem, setSelectedItem] = useState('all')
  const [categories, setCategories] = useState<Category[]>([])
  const [sources, setSources] = useState<Source[]>([])
  
  const [articlePage, setArticlePage] = useState<ArticlePage | null>(null)
  const [appError, setAppError] = useState<string | null>(null)
  const [loadingMoreFilterKey, setLoadingMoreFilterKey] = useState<string | null>(null)
  const [loadMoreError, setLoadMoreError] = useState<{
    filterKey: string
    message: string
  } | null>(null)

  const requestVersionRef = useRef(0)
  const loadingMoreRef = useRef(false)

  useEffect(() => {
    Promise.all([listCategories(), listSources()])
      .then(([loadedCategories, loadedSources]) => {
        setCategories(loadedCategories)
        setSources(loadedSources)
      })
      .catch((loadError: unknown) => {
        setAppError(
          loadError instanceof Error
            ? loadError.message
            : 'Can not load data from the server.',
        )
      })
  }, [])

  const selectedCategory = categories.find(
    (category) => `category:${category.id}` === selectedItem,
  )

  const selectedSource = sources.find(
    (feed) => `feed:${feed.id}` === selectedItem,
  )

  let title = 'All Articles'

  if (selectedItem === 'unread') {
    title = 'Unread'
  } else if (selectedItem === 'starred') {
    title = 'Starred'
  } else if (selectedItem === 'search') {
    title = 'Search'
  } else if (selectedCategory) {
    title = selectedCategory.name
  } else if (selectedSource) {
    title = selectedSource.name
  }

  const articleFilters = useMemo<ArticleListParams>(() => {
    const filters: ArticleListParams = {}

    if (selectedItem === 'unread') {
      filters.is_read = false
    } else if (selectedItem === 'starred') {
      filters.is_starred = true
    } else if (selectedItem.startsWith('category:')) {
      const categoryId = selectedItem.slice('category:'.length)

      filters.category_id = categoryId
    } else if (selectedItem.startsWith('feed:')) {
      const sourceId = selectedItem.slice('feed:'.length)

      filters.source_id = sourceId
    }

    return filters
  }, [selectedItem])

  const filterKey = JSON.stringify({
    selectedItem,
    ...articleFilters,
  })

  const currentPage =
    articlePage?.filterKey === filterKey ? articlePage : null

  const articles = currentPage?.items ?? []
  const nextOffset = currentPage?.nextOffset ?? 0
  const hasMore = currentPage?.hasMore ?? false

  const isLoading = selectedItem !== 'search' && currentPage === null
  const isLoadingMore = loadingMoreFilterKey === filterKey

  const error = currentPage?.error ?? appError

  const currentLoadMoreError =
    loadMoreError?.filterKey === filterKey
      ? loadMoreError.message
      : null

  useEffect(() => {
    const requestVersion = ++requestVersionRef.current

    loadingMoreRef.current = false

    if (selectedItem === 'search') {
      return () => {
        requestVersionRef.current = requestVersion + 1
      }
    }

    listArticles({
      ...articleFilters,
      limit: PAGE_SIZE,
      offset: 0,
    })
      .then((response) => {
        if (requestVersion !== requestVersionRef.current) return

        setArticlePage({
          filterKey,
          items: response.items,
          nextOffset: response.offset + response.items.length,
          hasMore: response.has_more,
          error: null,
        })
      })
      .catch((loadError: unknown) => {
        if (requestVersion !== requestVersionRef.current) return

        setArticlePage({
          filterKey,
          items: [],
          nextOffset: 0,
          hasMore: false,
          error:
            loadError instanceof Error
              ? loadError.message
              : 'Can not load articles from the server.',
        })
      })

    return () => {
      requestVersionRef.current = requestVersion + 1
    }
  }, [selectedItem, articleFilters, filterKey])

  const loadMoreArticles = useCallback(async () => {
    if (
      !hasMore ||
      isLoading ||
      loadingMoreRef.current ||
      selectedItem === 'search'
    ) {
      return
    }

    const requestVersion = requestVersionRef.current

    loadingMoreRef.current = true
    setLoadingMoreFilterKey(filterKey)
    setLoadMoreError(null)

    try {
      const response = await listArticles({
        ...articleFilters,
        limit: PAGE_SIZE,
        offset: nextOffset,
      })

      if (requestVersion !== requestVersionRef.current) return

      setArticlePage((current) => {
        if (!current || current.filterKey !== filterKey) return current

        const existingIds = new Set(current.items.map((article) => article.id))
        const newArticles = response.items.filter(
          (article) => !existingIds.has(article.id),
        )

        return {
          ...current,
          items: [...current.items, ...newArticles],
          nextOffset: response.offset + response.items.length,
          hasMore: response.has_more,
        }
      })
    } catch (loadError) {
      if (requestVersion !== requestVersionRef.current) return

      setLoadMoreError({
        filterKey,
        message:
          loadError instanceof Error
            ? loadError.message
            : 'Can not load more articles. Please try again.',
      })
    } finally {
      if (requestVersion === requestVersionRef.current) {
        loadingMoreRef.current = false
        setLoadingMoreFilterKey(null)
      }
    }
  }, [
    hasMore,
    isLoading,
    selectedItem,
    articleFilters,
    nextOffset,
    filterKey,
  ])

  const handleAddCategory = async (name: string) => {
    const newCategory = await createCategory(name)

    setCategories((current) =>
      [...current, newCategory].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    )

    return newCategory
  }

  const handleAddFeed = async (
    url: string,
    categoryId: string | null,
  ): Promise<Source> => {
    const newSource = await createSource(url, categoryId)

    setSources((current) =>
      [...current, newSource].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    )

    return newSource
  }

  const updateArticleState = async (
    articleId: string,
    changes: Partial<Pick<Article, 'is_read' | 'is_starred'>>,
  ) => {
    const previousArticle = articles.find(
      (article) => article.id === articleId,
    )

    if (!previousArticle) return

    setArticlePage((current) => {
      if (!current || current.filterKey !== filterKey) return current

      return {
        ...current,
        items: current.items.map((article) =>
          article.id === articleId
            ? { ...article, ...changes }
            : article,
        ),
      }
    })

    try {
      const updatedArticle = await updateArticle(articleId, changes)

      setArticlePage((current) => {
        if (!current || current.filterKey !== filterKey) return current

        return {
          ...current,
          items: current.items.map((article) =>
            article.id === articleId
              ? { ...article, ...updatedArticle }
              : article,
          ),
        }
      })

      if (
        (selectedItem === 'unread' && changes.is_read === true) ||
        (selectedItem === 'starred' && changes.is_starred === false)
      ) {
        setArticlePage((current) => {
          if (!current || current.filterKey !== filterKey) return current

          return {
            ...current,
            nextOffset: Math.max(0, current.nextOffset - 1),
          }
        })
      }
    } catch {
      setArticlePage((current) => {
        if (!current || current.filterKey !== filterKey) return current

        return {
          ...current,
          items: current.items.map((article) =>
            article.id === articleId
              ? { ...article, ...previousArticle }
              : article,
          ),
          error: 'Can not update the article state. Please try again.',
        }
      })
    }
  }

  const visibleArticles =
    selectedItem === 'unread'
      ? articles.filter((article) => !article.is_read)
      : selectedItem === 'starred'
        ? articles.filter((article) => article.is_starred)
        : articles

  return (
    <MainLayout
      selectedItem={selectedItem}
      onSelectItem={setSelectedItem}
      categories={categories}
      sources={sources}
      onAddCategory={handleAddCategory}
      onAddFeed={handleAddFeed}
    >
      <div className="px-8 py-7">
        <div className="mb-5 w-full">
          <h1 className="text-xl font-semibold tracking-tight">
            {title}
          </h1>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading articles…
          </p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <ArticleList
            articles={visibleArticles}
            sources={sources}
            onSelectFeed={setSelectedItem}
            onSetRead={(articleId, isRead) =>
              updateArticleState(articleId, { is_read: isRead })
            }
            onSetStarred={(articleId, isStarred) =>
              updateArticleState(articleId, { is_starred: isStarred })
            }
            onLoadMore={loadMoreArticles}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            loadMoreError={currentLoadMoreError}
          />
        )}
      </div>
    </MainLayout>
  )
}

export default App
