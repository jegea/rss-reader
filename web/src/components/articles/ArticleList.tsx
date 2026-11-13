
import { useEffect, useRef, useState } from 'react'

import {
  getArticle,
  type Article,
  type ArticleDetail,
} from '@/api/articles'
import type { Source } from '@/api/sources'

import ArticleItem from './ArticleItem'

type ArticleListProps = {
  articles: Article[]
  sources: Source[]
  onSelectFeed: (feedId: string) => void
  onSetRead: (articleId: string, isRead: boolean) => void
  onSetStarred: (articleId: string, isStarred: boolean) => void
  onLoadMore: () => void
  hasMore: boolean
  isLoadingMore: boolean
  loadMoreError: string | null
}

function ArticleList({
  articles,
  sources,
  onSelectFeed,
  onSetRead,
  onSetStarred,
  onLoadMore,
  hasMore,
  isLoadingMore,
  loadMoreError,
}: ArticleListProps) {
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(
    null,
  )
  const [articleDetails, setArticleDetails] = useState<
    Record<string, ArticleDetail>
  >({})
  const [loadingArticleId, setLoadingArticleId] = useState<string | null>(null)
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({})

  const handleToggle = (article: Article, open: boolean) => {
    setExpandedArticleId(open ? article.id : null)

    if (!open || articleDetails[article.id] || loadingArticleId === article.id) {
      return
    }

    setLoadingArticleId(article.id)
    getArticle(article.id)
      .then((detail) =>
        setArticleDetails((current) => ({ ...current, [article.id]: detail })),
      )
      .catch(() =>
        setDetailErrors((current) => ({
          ...current,
          [article.id]: 'The article content could not be loaded.',
        })),
      )
      .finally(() => setLoadingArticleId(null))
  }

  const articleRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!expandedArticleId) return

    if (loadingArticleId === expandedArticleId) return

    const element = articleRefs.current[expandedArticleId]

    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [expandedArticleId, loadingArticleId])

  useEffect(() => {
    const element = loadMoreRef.current

    if (!element || !hasMore || isLoadingMore || loadMoreError) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore()
        }
      },
      {
        rootMargin: '300px',
      },
    )

    observer.observe(element)

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, loadMoreError, onLoadMore])

  return (
    <div className="w-full">
      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
          <p className="text-base font-medium">There is no content yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Here will appear the content from your sources.
          </p>
        </div>
      ) : (
        articles.map((article) => (
          <div
            key={article.id}
            ref={(element) => {
              articleRefs.current[article.id] = element
            }}
            className="scroll-mt-0"
          >
            <ArticleItem
              article={article}
              isExpanded={expandedArticleId === article.id}
              onToggle={(open) => handleToggle(article, open)}
              onSelectFeed={onSelectFeed}
              sources={sources}
              onSetRead={onSetRead}
              onSetStarred={onSetStarred}
              detail={articleDetails[article.id]}
              isLoadingDetail={loadingArticleId === article.id}
              detailError={detailErrors[article.id]}
            />
          </div>
        ))
      )}

      {hasMore && (
        <div
          ref={loadMoreRef}
          className="flex flex-col items-center justify-center gap-3 py-8"
        >
          {isLoadingMore ? (
            <p className="text-sm text-muted-foreground">
              Loading more articles…
            </p>
          ) : loadMoreError ? (
            <>
              <p className="text-sm text-destructive">{loadMoreError}</p>
              <button
                type="button"
                onClick={onLoadMore}
                className="text-sm font-medium underline underline-offset-4 hover:text-primary"
              >
                Try again
              </button>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default ArticleList
