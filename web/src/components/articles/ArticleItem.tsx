import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import type { Article, ArticleDetail } from '@/api/articles'
import type { Source } from '@/api/sources'
import DOMPurify from 'dompurify'

import { ExternalLink, Mail, MailOpen, Star, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type ArticleItemProps = {
  article: Article
  isExpanded: boolean
  onToggle: (open: boolean) => void
  onSelectFeed: (feedId: string) => void
  sources: Source[]
  onSetRead: (articleId: string, isRead: boolean) => void
  onSetStarred: (articleId: string, isStarred: boolean) => void
  detail?: ArticleDetail
  isLoadingDetail: boolean
  detailError?: string
}

function ArticleItem({
  article,
  isExpanded,
  onToggle,
  onSelectFeed,
  sources,
  onSetRead,
  onSetStarred,
  detail,
  isLoadingDetail,
  detailError,
}: ArticleItemProps) {
  const source = sources.find((item) => item.id === article.source_id)

  const publishedAt = formatDistanceToNow(
    new Date(article.published_at ?? article.created_at),
    {
      addSuffix: true,
      locale: es,
    },
  )

  const sanitizedContent = detail?.content
    ? DOMPurify.sanitize(detail.content)
    : ''

  const handleToggle = (open: boolean) => {
    onToggle(open)

    if (open && !article.is_read) {
      onSetRead(article.id, true)
    }
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={handleToggle}>
      {!isExpanded && (
        <div className="grid grid-cols-[160px_minmax(0,1fr)_140px] items-center gap-4 border-b border-gray-100 px-6 py-2 transition-colors hover:bg-muted/40">
          <button
          type="button"
          className="flex h-full w-full cursor-pointer items-center text-left text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onSelectFeed(article.source_id)}
          >
            <span className="truncate underline-offset-2 hover:underline">
                {source?.name ?? 'Fuente desconocida'}
            </span>
          </button>

          <CollapsibleTrigger className="min-w-0 cursor-pointer text-left">
            <span
              className={`block truncate text-sm ${
                article.is_read
                  ? 'font-normal text-muted-foreground'
                  : 'font-medium text-foreground'
              }`}
              title={article.title}
            >
              {article.title}
            </span>
          </CollapsibleTrigger>

          <time
            dateTime={article.published_at ?? article.created_at}
            className="whitespace-nowrap text-right text-xs text-muted-foreground"
          >
            {publishedAt}
          </time>
        </div>
      )}


      <CollapsibleContent>
        <div>
          {isLoadingDetail && (
            <p className="text-sm text-muted-foreground">
              Loading article content...
            </p>
          )}

          {detailError && (
            <p className="text-sm text-destructive">
              {detailError}
            </p>
          )}

          {detail && (
            <div className="relative border-x border-b border-border border-gray-100">
              {/* Close button */}
              <div
                className="flex w-full cursor-pointer justify-end text-gray-400 hover:text-foreground"
                onClick={() => onToggle(false)}
              >
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Close article"
                      onClick={() => onToggle(false)}
                      className="flex w-full cursor-pointer justify-end px-2 py-1 text-gray-400 transition-colors hover:text-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Close article</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              </div>
              <article className="mx-auto w-full max-w-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">

                    <h1 className="mb-1 text-3xl font-bold leading-tight tracking-tight">
                      <a
                        href={detail.normalized_url || article.url || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary"
                      >
                        {article.title}
                      </a>
                    </h1>

                    <span className="mb-3 block text-sm text-muted-foreground">
                      {source?.name ?? 'Unknown Source'} by {detail.author} | {publishedAt}
                    </span>
                  </div>
                </div>

                <div className="mt-1 mb-5 flex justify-end text-sm text-muted-foreground border rounded-lg">
                  <TooltipProvider delayDuration={300}>
                    <div className="m-2 flex items-center">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={article.is_read ? 'Mark as unread' : 'Mark as read'}
                            onClick={() => onSetRead(article.id, !article.is_read)}
                          >
                            {article.is_read ? (
                              <Mail className="size-4" />
                            ) : (
                              <MailOpen className="size-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {article.is_read ? 'Mark as unread' : 'Mark as read'}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={
                              article.is_starred ? 'Remove from favorites' : 'Add to favorites'
                            }
                            onClick={() => onSetStarred(article.id, !article.is_starred)}
                          >
                            <Star
                              className={
                                article.is_starred
                                  ? 'size-4 fill-amber-400 text-amber-500'
                                  : 'size-4'
                              }
                            />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {article.is_starred ? 'Remove from favorites' : 'Add to favorites'}
                        </TooltipContent>
                      </Tooltip>

                      {(detail.normalized_url || article.url) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              asChild
                              aria-label="Open original article"
                            >
                              <a
                                href={detail.normalized_url || article.url!}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="size-4" />
                              </a>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Open original article</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                </div>

                {sanitizedContent ? (
                  <div
                    className="
                      text-base leading-7 text-foreground
                      [&_p]:mb-6
                      [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-tight
                      [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold
                      [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2
                      [&_img]:mx-auto [&_img]:my-8 [&_img]:h-auto [&_img]:max-w-full
                      [&_ul]:mb-6 [&_ul]:list-disc [&_ul]:pl-6
                      [&_ol]:mb-6 [&_ol]:list-decimal [&_ol]:pl-6
                      [&_li]:mb-2
                      [&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground
                      [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4
                      [&_code]:font-mono [&_code]:text-sm
                      [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse
                      [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2
                      [&_td]:border [&_td]:border-border [&_td]:p-2
                    "
                    dangerouslySetInnerHTML={{
                      __html: sanitizedContent,
                    }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This article does not have content available.
                  </p>
                )}

                <div className="mt-8 mb-8 flex justify-center rounded-lg border border-border text-sm text-muted-foreground transition-colors hover:border-gray-400 hover:text-foreground">
                  {detail.normalized_url && (
                    <a
                      href={detail.normalized_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 font-medium"
                    >
                      Read original article
                    </a>
                  )}
                </div>
              </article>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export default ArticleItem
