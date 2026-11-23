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
  deleteCategory,
  listCategories,
  updateCategory,
  type Category,
} from './api/categories'
import {
  createSource,
  listSources,
  updateSource,
  deleteSource,
  type Source,
} from './api/sources'

import FeedDialogs from './components/feeds/FeedDialogs'
import CategoryDialogs from './components/categories/CategoryDialogs'

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
  
  const [articleRefreshKey, setArticleRefreshKey] = useState(0)
  const [articlePage, setArticlePage] = useState<ArticlePage | null>(null)
  const [appError, setAppError] = useState<string | null>(null)
  const [loadingMoreFilterKey, setLoadingMoreFilterKey] = useState<string | null>(null)
  const [loadMoreError, setLoadMoreError] = useState<{
    filterKey: string
    message: string
  } | null>(null)

  // Category dialogs
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false)
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [categoryDeleteError, setCategoryDeleteError] = useState<string | null>(null)
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)

  // Feed dialogs
  const [isAddFeedDialogOpen, setIsAddFeedDialogOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [editingFeedId, setEditingFeedId] = useState<string | null>(null)
  const [movingFeedId, setMovingFeedId] = useState<string | null>(null)
  const [deletingFeedId, setDeletingFeedId] = useState<string | null>(null)
  const [isEditFeedDialogOpen, setIsEditFeedDialogOpen] = useState(false)
  const [isMoveFeedDialogOpen, setIsMoveFeedDialogOpen] = useState(false)
  const [feedDeleteError, setFeedDeleteError] = useState<string | null>(null)
  const [isDeletingFeed, setIsDeletingFeed] = useState(false)
  const [feedName, setFeedName] = useState('')
  const [isUpdatingFeed, setIsUpdatingFeed] = useState(false)
  const [feedEditError, setFeedEditError] = useState<string | null>(null)
  const [targetCategoryId, setTargetCategoryId] = useState('')
  const [feedMoveError, setFeedMoveError] = useState<string | null>(null)

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
    articleRefreshKey,
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

  const handleUpdateFeed = async (
    id: string,
    changes: Partial<Pick<Source, 'name' | 'category_id'>>,
  ): Promise<Source> => {
    const previousSource = sources.find((source) => source.id === id)

    const updatedSource = await updateSource(id, changes)

    setSources((current) =>
      current
        .map((source) =>
          source.id === id ? updatedSource : source,
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    )

    if (
      previousSource &&
      previousSource.category_id !== updatedSource.category_id &&
      (selectedItem === `category:${previousSource.category_id}` ||
        selectedItem === `category:${updatedSource.category_id}`)
    ) {
      setArticleRefreshKey((current) => current + 1)
    }

    return updatedSource
  }

  const handleDeleteFeed = async (id: string): Promise<void> => {
    await deleteSource(id)

    setSources((current) =>
      current.filter((source) => source.id !== id),
    )

    if (selectedItem === `feed:${id}`) {
      setSelectedItem('all')
    } else if (selectedItem !== 'search') {
      setArticleRefreshKey((current) => current + 1)
    }
  }

  const handleUpdateCategory = async (
    id: string,
    name: string,
  ): Promise<Category> => {
    const updatedCategory = await updateCategory(id, name)

    setCategories((current) =>
      current
        .map((category) =>
          category.id === id ? updatedCategory : category,
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    )

    return updatedCategory
  }

  const handleDeleteCategory = async (id: string): Promise<void> => {
    const categorySourceIds = new Set(
      sources
        .filter((source) => source.category_id === id)
        .map((source) => source.id),
    )

    await deleteCategory(id)

    setCategories((current) =>
      current.filter((category) => category.id !== id),
    )

    setSources((current) =>
      current.filter((source) => source.category_id !== id),
    )

    if (
      selectedItem === `category:${id}` ||
      (selectedItem.startsWith('feed:') &&
        categorySourceIds.has(selectedItem.slice('feed:'.length)))
    ) {
      setSelectedItem('all')
    }
  }

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategoryId || isDeletingCategory) return

    setIsDeletingCategory(true)
    setCategoryDeleteError(null)

    try {
      await handleDeleteCategory(deletingCategoryId)
      setDeletingCategoryId(null)
    } catch (error) {
      setCategoryDeleteError(
        error instanceof Error
          ? error.message
          : 'Could not delete the category. Please try again.',
      )
    } finally {
      setIsDeletingCategory(false)
    }
  }

  const handleConfirmDeleteFeed = async () => {
    if (!deletingFeedId || isDeletingFeed) return

    setIsDeletingFeed(true)
    setFeedDeleteError(null)

    try {
      await handleDeleteFeed(deletingFeedId)
      setDeletingFeedId(null)
    } catch (error) {
      setFeedDeleteError(
        error instanceof Error
          ? error.message
          : 'Could not delete the feed. Please try again.',
      )
    } finally {
      setIsDeletingFeed(false)
    }
  }

  const handleConfirmRenameFeed = async () => {
    const trimmedName = feedName.trim()

    if (!editingFeedId || !trimmedName || isUpdatingFeed) return

    setIsUpdatingFeed(true)
    setFeedEditError(null)

    try {
      await handleUpdateFeed(editingFeedId, { name: trimmedName })
      setIsEditFeedDialogOpen(false)
      setEditingFeedId(null)
    } catch (error) {
      setFeedEditError(
        error instanceof Error
          ? error.message
          : 'Could not rename the feed. Please try again.',
      )
    } finally {
      setIsUpdatingFeed(false)
    }
  }

  const handleConfirmMoveFeed = async () => {
    if (!movingFeedId || isUpdatingFeed) return

    setIsUpdatingFeed(true)
    setFeedMoveError(null)

    try {
      await handleUpdateFeed(movingFeedId, {
        category_id: targetCategoryId || null,
      })

      setIsMoveFeedDialogOpen(false)
      setMovingFeedId(null)
    } catch (error) {
      setFeedMoveError(
        error instanceof Error
          ? error.message
          : 'Could not move the feed. Please try again.',
      )
    } finally {
      setIsUpdatingFeed(false)
    }
  }

  const handleOpenAddCategory = () => {
    setIsAddCategoryDialogOpen(true)
  }

  const handleOpenRenameCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setIsEditCategoryDialogOpen(true)
  }

  const handleOpenDeleteCategory = (category: Category) => {
    setCategoryDeleteError(null)
    setDeletingCategoryId(category.id)
  }

  const handleOpenGlobalAddFeed = () => {
    setSelectedCategoryId(null)
    setIsAddFeedDialogOpen(true)
  }

  const handleOpenAddFeed = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setIsAddFeedDialogOpen(true)
  }

  const handleOpenRenameFeed = (source: Source) => {
    setEditingFeedId(source.id)
    setFeedName(source.name)
    setFeedEditError(null)
    setIsEditFeedDialogOpen(true)
  }

  const handleOpenMoveFeed = (source: Source) => {
    setMovingFeedId(source.id)
    setTargetCategoryId('')
    setFeedMoveError(null)
    setIsMoveFeedDialogOpen(true)
  }

  const handleOpenDeleteFeed = (source: Source) => {
    setFeedDeleteError(null)
    setDeletingFeedId(source.id)
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
    <>
      <MainLayout
        selectedItem={selectedItem}
        onSelectItem={setSelectedItem}
        categories={categories}
        sources={sources}
        onOpenAddCategory={handleOpenAddCategory}
        onOpenGlobalAddFeed={handleOpenGlobalAddFeed}
        onOpenRenameCategory={handleOpenRenameCategory}
        onOpenDeleteCategory={handleOpenDeleteCategory}
        onOpenAddFeed={handleOpenAddFeed}
        onOpenRenameFeed={handleOpenRenameFeed}
        onOpenMoveFeed={handleOpenMoveFeed}
        onOpenDeleteFeed={handleOpenDeleteFeed}
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

      <CategoryDialogs
        categories={categories}
        isAddDialogOpen={isAddCategoryDialogOpen}
        setIsAddDialogOpen={setIsAddCategoryDialogOpen}
        isEditDialogOpen={isEditCategoryDialogOpen}
        setIsEditDialogOpen={setIsEditCategoryDialogOpen}
        editingCategoryId={editingCategoryId}
        deletingCategoryId={deletingCategoryId}
        setDeletingCategoryId={setDeletingCategoryId}
        deleteError={categoryDeleteError}
        setDeleteError={setCategoryDeleteError}
        isDeletingCategory={isDeletingCategory}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onConfirmDeleteCategory={handleConfirmDeleteCategory}
      />

      <FeedDialogs
        categories={categories}
        sources={sources}
        isAddFeedDialogOpen={isAddFeedDialogOpen}
        setIsAddFeedDialogOpen={setIsAddFeedDialogOpen}
        selectedCategoryId={selectedCategoryId}
        onAddFeed={handleAddFeed}
        isEditFeedDialogOpen={isEditFeedDialogOpen}
        setIsEditFeedDialogOpen={setIsEditFeedDialogOpen}
        setEditingFeedId={setEditingFeedId}
        feedName={feedName}
        setFeedName={setFeedName}
        feedEditError={feedEditError}
        setFeedEditError={setFeedEditError}
        isUpdatingFeed={isUpdatingFeed}
        onRenameFeed={handleConfirmRenameFeed}
        isMoveFeedDialogOpen={isMoveFeedDialogOpen}
        setIsMoveFeedDialogOpen={setIsMoveFeedDialogOpen}
        movingFeedId={movingFeedId}
        setMovingFeedId={setMovingFeedId}
        targetCategoryId={targetCategoryId}
        setTargetCategoryId={setTargetCategoryId}
        feedMoveError={feedMoveError}
        setFeedMoveError={setFeedMoveError}
        onMoveFeed={handleConfirmMoveFeed}
        deletingFeedId={deletingFeedId}
        setDeletingFeedId={setDeletingFeedId}
        feedDeleteError={feedDeleteError}
        setFeedDeleteError={setFeedDeleteError}
        isDeletingFeed={isDeletingFeed}
        onDeleteFeed={handleConfirmDeleteFeed}
      />
    </>
  )
}

export default App
