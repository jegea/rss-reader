import { Folder, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import type { Source } from '@/api/sources'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'

type FeedItemProps = {
  source: Source
  isActive: boolean
  nested?: boolean
  onSelect: () => void
  onRename: (source: Source) => void
  onMove: (source: Source) => void
  onDelete: (source: Source) => void
}

export default function FeedItem({
  source,
  isActive,
  nested = false,
  onSelect,
  onRename,
  onMove,
  onDelete,
}: FeedItemProps) {
  const feedButton = nested ? (
    <SidebarMenuSubButton
      isActive={isActive}
      onClick={onSelect}
      className="pr-10"
    >
      <span className="min-w-0 flex-1 truncate">{source.name}</span>
    </SidebarMenuSubButton>
  ) : (
    <SidebarMenuButton
      isActive={isActive}
      onClick={onSelect}
      className="pr-10"
    >
      <span className="w-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{source.name}</span>
    </SidebarMenuButton>
  )

  const content = (
    <div className="group/feed relative">
      {feedButton}

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Actions for ${source.name}`}
            className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-accent hover:text-accent-foreground group-hover/feed:opacity-100 focus-visible:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </PopoverTrigger>

        <PopoverContent align="start" side="right" className="w-40 p-1">
          <button
            type="button"
            onClick={() => onRename(source)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <Pencil className="size-4" />
            Rename
          </button>

          <button
            type="button"
            onClick={() => onMove(source)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
          >
            <Folder className="size-4" />
            Move
          </button>

          <button
            type="button"
            onClick={() => onDelete(source)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
          >
            <Trash2 className="size-4" />
            Delete
          </button>
        </PopoverContent>
      </Popover>
    </div>
  )

  return nested ? (
    <SidebarMenuSubItem>{content}</SidebarMenuSubItem>
  ) : (
    <SidebarMenuItem>{content}</SidebarMenuItem>
  )
}