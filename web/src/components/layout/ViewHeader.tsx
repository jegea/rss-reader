
import {
  CheckCheck,
  Folder,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'

import type { Category } from '@/api/categories'
import type { Source } from '@/api/sources'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type ViewHeaderProps = {
  title: string
  type: 'general' | 'category' | 'feed' | 'filtered'
  category?: Category
  source?: Source
  onAddFeed?: () => void
  onRenameCategory?: (category: Category) => void
  onDeleteCategory?: (category: Category) => void
  onRenameFeed?: (source: Source) => void
  onMoveFeed?: (source: Source) => void
  onDeleteFeed?: (source: Source) => void
  onRefresh?: () => void
  isRefreshing?: boolean
}

function ViewHeader({
  title,
  type,
  category,
  source,
  onAddFeed,
  onRenameCategory,
  onDeleteCategory,
  onRenameFeed,
  onMoveFeed,
  onDeleteFeed,
  onRefresh,
  isRefreshing = false,
}: ViewHeaderProps) {
  return (
    <div className="mb-5 flex w-full items-center justify-between">
      <h1 className="text-xl font-semibold tracking-tight">
        {title}
      </h1>

      <div className="flex items-center gap-1">
        {type === 'category' && (
          <button
            type="button"
            aria-label="Add feed"
            onClick={onAddFeed}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="size-4" />
          </button>
        )}

        {(type === 'category' || type === 'feed') && (
          <button
            type="button"
            aria-label="Mark all as read"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <CheckCheck className="size-4" />
          </button>
        )}

        {type !== 'filtered' && (
          <button
            type="button"
            aria-label="Refresh"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        )}

        {(type === 'category' || type === 'feed') && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="More options"
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-40 p-1">
              {type === 'category' && category && (
                <>
                  <button
                    type="button"
                    onClick={() => onRenameCategory?.(category)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <Pencil className="size-4" />
                    Rename
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteCategory?.(category)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                </>
              )}

              {type === 'feed' && source && (
                <>
                  <button
                    type="button"
                    onClick={() => onRenameFeed?.(source)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <Pencil className="size-4" />
                    Rename
                  </button>

                  <button
                    type="button"
                    onClick={() => onMoveFeed?.(source)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <Folder className="size-4" />
                    Move
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteFeed?.(source)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </button>
                </>
              )}
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  )
}

export default ViewHeader
