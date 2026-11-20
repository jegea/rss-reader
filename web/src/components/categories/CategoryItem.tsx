import {
  ChevronRight,
  Folder,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'

import type { Category } from '@/api/categories'
import type { Source } from '@/api/sources'

import FeedItem from '@/components/feeds/FeedItem'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@/components/ui/sidebar'

type CategoryItemProps = {
  category: Category
  categoryFeeds: Source[]
  selectedItem: string
  onSelectItem: (item: string) => void
  onRenameCategory: (category: Category) => void
  onDeleteCategory: (category: Category) => void
  onAddFeed: (categoryId: string) => void
  onRenameFeed: (source: Source) => void
  onMoveFeed: (source: Source) => void
  onDeleteFeed: (source: Source) => void
}

function CategoryItem({
  category,
  categoryFeeds,
  selectedItem,
  onSelectItem,
  onRenameCategory,
  onDeleteCategory,
  onAddFeed,
  onRenameFeed,
  onMoveFeed,
  onDeleteFeed,
}: CategoryItemProps) {
  return (
    <Collapsible className="group/collapsible">
      <SidebarMenuItem>
        <div className="group/category relative">
          <SidebarMenuButton
            isActive={selectedItem === `category:${category.id}`}
            onClick={() => onSelectItem(`category:${category.id}`)}
            className="pr-24"
          >
            <Folder />
            <span className="min-w-0 flex-1 truncate">
              {category.name}
            </span>
          </SidebarMenuButton>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Manage ${category.name}`}
                className="absolute right-16 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-sidebar-foreground/70 opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-hover/category:opacity-100"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </PopoverTrigger>

            <PopoverContent
              align="end"
              side="right"
              sideOffset={8}
              className="w-48 p-1"
            >
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => onRenameCategory(category)}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <Pencil className="size-4" />
                  <span>Rename category</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteCategory(category)}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-destructive hover:bg-accent"
                >
                  <Trash2 className="size-4" />
                  <span>Delete category</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>

          <button
            type="button"
            aria-label={`Add feed to ${category.name}`}
            onClick={() => onAddFeed(category.id)}
            className="absolute right-8 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-sidebar-foreground/70 opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-hover/category:opacity-100"
          >
            <Plus className="size-4" />
          </button>

          {categoryFeeds.length > 0 && (
            <CollapsibleTrigger asChild>
              <SidebarMenuAction>
                <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                <span className="sr-only">
                  Expand or collapse {category.name}
                </span>
              </SidebarMenuAction>
            </CollapsibleTrigger>
          )}
        </div>

        {categoryFeeds.length > 0 && (
          <CollapsibleContent>
            <SidebarMenuSub>
              {categoryFeeds.map((source) => (
                <FeedItem
                  key={source.id}
                  source={source}
                  isActive={selectedItem === `feed:${source.id}`}
                  nested
                  onSelect={() => onSelectItem(`feed:${source.id}`)}
                  onRename={onRenameFeed}
                  onMove={onMoveFeed}
                  onDelete={onDeleteFeed}
                />
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </SidebarMenuItem>
    </Collapsible>
  )
}

export default CategoryItem