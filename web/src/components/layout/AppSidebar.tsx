import {
  Folder,
  Inbox,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Star,
} from 'lucide-react'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

import type { Category } from '@/api/categories'
import type { Source } from '@/api/sources'
import { useState } from 'react'
import FeedItem from '@/components/feeds/FeedItem'
import CategoryItem from '@/components/categories/CategoryItem'

type AppSidebarProps = {
  selectedItem: string
  onSelectItem: (item: string) => void
  categories: Category[]
  sources: Source[]
  onOpenAddCategory: () => void
  onOpenGlobalAddFeed: () => void
  onOpenRenameCategory: (category: Category) => void
  onOpenDeleteCategory: (category: Category) => void
  onOpenAddFeed: (categoryId: string) => void
  onOpenRenameFeed: (source: Source) => void
  onOpenMoveFeed: (source: Source) => void
  onOpenDeleteFeed: (source: Source) => void
}

function AppSidebar({
  selectedItem,
  onSelectItem,
  categories,
  sources,
  onOpenAddCategory,
  onOpenGlobalAddFeed,
  onOpenRenameCategory,
  onOpenDeleteCategory,
  onOpenAddFeed,
  onOpenRenameFeed,
  onOpenMoveFeed,
  onOpenDeleteFeed,
}: AppSidebarProps) {
  const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false)

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="px-2 py-2">
          <h1 className="text-lg font-semibold tracking-tight">
            RSS Reader
          </h1>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Navegación principal */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={selectedItem === 'all'}
                onClick={() => onSelectItem('all')}
              >
                <Inbox />
                <span>All Articles</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={selectedItem === 'unread'}
                onClick={() => onSelectItem('unread')}
              >
                <Sparkles />
                <span>Unread</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={selectedItem === 'starred'}
                onClick={() => onSelectItem('starred')}
              >
                <Star />
                <span>Starred</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={selectedItem === 'search'}
                onClick={() => onSelectItem('search')}
              >
                <Search />
                <span>Search</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Acciones para gestionar los feeds */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Plus />
                <span>Add Feed</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton>
                <Settings2 />
                <span>Manage Feeds</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Categorías y feeds */}
        <SidebarGroup>
          <div className="group/feeds-header mb-2 flex h-8 items-center justify-between rounded-md px-2">
            <SidebarGroupLabel className="p-0">
              Feeds
            </SidebarGroupLabel>

            <Popover
              open={isAddPopoverOpen}
              onOpenChange={setIsAddPopoverOpen}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Add feeds or categories"
                  className="flex size-6 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-sidebar-accent group-hover/feeds-header:opacity-100 focus-visible:opacity-100"
                >
                  <Plus className="size-4" />
                </button>
              </PopoverTrigger>

              <PopoverContent
                align="end"
                side="bottom"
                sideOffset={4}
                className="w-44 p-1"
              >
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddPopoverOpen(false)
                      onOpenAddCategory()
                    }}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-left hover:bg-accent"
                  >
                    <Folder className="size-4" />
                    <span>Add category</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddPopoverOpen(false)
                      onOpenGlobalAddFeed()
                    }}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-left hover:bg-accent"
                  >
                    <Plus className="size-4" />
                    <span>Add feed</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <SidebarMenu>
            {categories.map((category) => {
              const categoryFeeds = sources.filter(
                (source) => source.category_id === category.id,
              )

              return (
                <CategoryItem
                  key={category.id}
                  category={category}
                  categoryFeeds={categoryFeeds}
                  selectedItem={selectedItem}
                  onSelectItem={onSelectItem}
                  onRenameCategory={onOpenRenameCategory}
                  onDeleteCategory={onOpenDeleteCategory}
                  onAddFeed={onOpenAddFeed}
                  onRenameFeed={onOpenRenameFeed}
                  onMoveFeed={onOpenMoveFeed}
                  onDeleteFeed={onOpenDeleteFeed}
                />
              )
            })}

            {/* Feeds that don't belong to any category */}
            {sources
              .filter((source) => source.category_id === null)
              .map((source) => (
                <FeedItem
                  key={source.id}
                  source={source}
                  isActive={selectedItem === `feed:${source.id}`}
                  onSelect={() => onSelectItem(`feed:${source.id}`)}
                  onRename={onOpenRenameFeed}
                  onMove={onOpenMoveFeed}
                  onDelete={onOpenDeleteFeed}
                />
              ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
