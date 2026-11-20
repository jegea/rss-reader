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
import FeedDialogs from '@/components/feeds/FeedDialogs'
import CategoryDialogs from '@/components/categories/CategoryDialogs'
import CategoryItem from '@/components/categories/CategoryItem'

type AppSidebarProps = {
  selectedItem: string
  onSelectItem: (item: string) => void
  categories: Category[]
  sources: Source[]
  onAddCategory: (name: string) => Promise<Category>
  onAddFeed: (url: string, categoryId: string | null) => Promise<Source>
  onUpdateCategory: (id: string, name: string) => Promise<Category>
  onDeleteCategory: (id: string) => Promise<void>
  onDeleteFeed: (id: string) => Promise<void>
  onUpdateFeed: (id: string, changes: Partial<Pick<Source, 'name' | 'category_id'>>) => Promise<Source>
}

function AppSidebar({
  selectedItem,
  onSelectItem,
  categories,
  sources,
  onAddCategory,
  onAddFeed,
  onDeleteCategory,
  onUpdateCategory,
  onDeleteFeed,
  onUpdateFeed,
}: AppSidebarProps) {
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddFeedDialogOpen, setIsAddFeedDialogOpen] = useState(false)
  const [isAddPopoverOpen, setIsAddPopoverOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeletingCategory, setIsDeletingCategory] = useState(false)
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

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategoryId || isDeletingCategory) return

    setIsDeletingCategory(true)
    setDeleteError(null)

    try {
      await onDeleteCategory(deletingCategoryId)
      setDeletingCategoryId(null)
    } catch (error) {
      setDeleteError(
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
      await onDeleteFeed(deletingFeedId)
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
      await onUpdateFeed(editingFeedId, { name: trimmedName })
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
      await onUpdateFeed(movingFeedId, {
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

  const handleOpenRenameCategory = (category: Category) => {
    setEditingCategoryId(category.id)
    setIsEditDialogOpen(true)
  }

  const handleOpenDeleteCategory = (category: Category) => {
    setDeleteError(null)
    setDeletingCategoryId(category.id)
  }

  const handleOpenAddFeed = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setIsAddFeedDialogOpen(true)
  }

  const handleOpenGlobalAddFeed = () => {
    setSelectedCategoryId(null)
    setIsAddFeedDialogOpen(true)
  }

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
                      setIsAddDialogOpen(true)
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
                      handleOpenGlobalAddFeed()
                    }}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-left hover:bg-accent"
                  >
                    <Plus className="size-4" />
                    <span>Add feed</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            <CategoryDialogs
              categories={categories}
              isAddDialogOpen={isAddDialogOpen}
              setIsAddDialogOpen={setIsAddDialogOpen}
              isEditDialogOpen={isEditDialogOpen}
              setIsEditDialogOpen={setIsEditDialogOpen}
              editingCategoryId={editingCategoryId}
              deletingCategoryId={deletingCategoryId}
              setDeletingCategoryId={setDeletingCategoryId}
              deleteError={deleteError}
              setDeleteError={setDeleteError}
              isDeletingCategory={isDeletingCategory}
              onAddCategory={onAddCategory}
              onUpdateCategory={onUpdateCategory}
              onConfirmDeleteCategory={handleConfirmDeleteCategory}
            />

            <FeedDialogs
              categories={categories}
              sources={sources}
              isAddFeedDialogOpen={isAddFeedDialogOpen}
              setIsAddFeedDialogOpen={setIsAddFeedDialogOpen}
              selectedCategoryId={selectedCategoryId}
              onAddFeed={onAddFeed}
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
                  onRenameCategory={handleOpenRenameCategory}
                  onDeleteCategory={handleOpenDeleteCategory}
                  onAddFeed={handleOpenAddFeed}
                  onRenameFeed={handleOpenRenameFeed}
                  onMoveFeed={handleOpenMoveFeed}
                  onDeleteFeed={handleOpenDeleteFeed}
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
                  onRename={handleOpenRenameFeed}
                  onMove={handleOpenMoveFeed}
                  onDelete={handleOpenDeleteFeed}
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
