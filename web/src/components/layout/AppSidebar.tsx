import {
  ChevronRight,
  Folder,
  Inbox,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'

import type { Category } from '@/api/categories'
import type { Source } from '@/api/sources'

import { useState } from 'react'
import AddCategoryForm from '@/components/feeds/AddCategoryForm'

import AddFeedForm from '@/components/feeds/AddFeedForm'

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

  const deletingCategory = categories.find(
    (category) => category.id === deletingCategoryId,
  )

  const movingFeed = sources.find(
    (source) => source.id === movingFeedId,
  )

  const deletingFeed = sources.find(
    (source) => source.id === deletingFeedId,
  )

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
                      setIsAddFeedDialogOpen(true)
                    }}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-sm text-left hover:bg-accent"
                  >
                    <Plus className="size-4" />
                    <span>Add feed</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            <Dialog
              open={isAddDialogOpen}
              onOpenChange={setIsAddDialogOpen}
            >
              <DialogContent className="w-[calc(100%-2rem)] max-w-md p-6">
                <DialogHeader>
                  <DialogTitle>Create New Category</DialogTitle>
                  <DialogDescription>
                    Create a category to organise your feeds.
                  </DialogDescription>
                </DialogHeader>

                <AddCategoryForm
                  onCancel={() => setIsAddDialogOpen(false)}
                  onSubmit={async (name) => {
                    await onAddCategory(name)
                    setIsAddDialogOpen(false)
                  }}
                />
              </DialogContent>
            </Dialog>

            <Dialog
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
            >
              <DialogContent className="w-[calc(100%-2rem)] max-w-md p-6">
                <DialogHeader>
                  <DialogTitle>Rename Category</DialogTitle>
                  <DialogDescription>
                    Change the name of this category.
                  </DialogDescription>
                </DialogHeader>

                {categories
                  .filter((category) => category.id === editingCategoryId)
                  .map((category) => (
                    <AddCategoryForm
                      key={category.id}
                      initialName={category.name}
                      submitLabel="Save changes"
                      onCancel={() => setIsEditDialogOpen(false)}
                      onSubmit={async (name) => {
                        await onUpdateCategory(category.id, name)
                        setIsEditDialogOpen(false)
                      }}
                    />
                  ))}
              </DialogContent>
            </Dialog>

            <Dialog
              open={deletingCategoryId !== null}
              onOpenChange={(open: boolean) => {
                if (!open && !isDeletingCategory) {
                  setDeletingCategoryId(null)
                  setDeleteError(null)
                }
              }}
            >
              <DialogContent className="w-[calc(100%-2rem)] max-w-md p-6">
                <DialogHeader>
                  <DialogTitle>Delete Category</DialogTitle>
                  <DialogDescription>
                    <p>Are you sure you want to delete{' '}
                    <strong>{deletingCategory?.name}</strong>?</p>
                    <p>This will permanently delete all feeds assigned to this
                    category and all articles.</p>
                    <p><strong>This action cannot be undone.</strong></p>
                  </DialogDescription>
                </DialogHeader>

                {deleteError && (
                  <p role="alert" className="text-sm text-destructive">
                    {deleteError}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={isDeletingCategory}
                    onClick={() => {
                      setDeletingCategoryId(null)
                      setDeleteError(null)
                    }}
                    className="rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={isDeletingCategory || !deletingCategory}
                    onClick={handleConfirmDeleteCategory}
                    className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray/70 disabled:opacity-50"
                  >
                    {isDeletingCategory ? 'Deleting…' : 'Delete category'}
                  </button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isEditFeedDialogOpen}
              onOpenChange={(open: boolean) => {
                if (!open && !isUpdatingFeed) {
                  setIsEditFeedDialogOpen(false)
                  setEditingFeedId(null)
                  setFeedEditError(null)
                }
              }}
            >
              <DialogContent className="w-[calc(100%-2rem)] max-w-md p-6">
                <DialogHeader>
                  <DialogTitle>Rename Feed</DialogTitle>
                  <DialogDescription>
                    Change the name of this feed.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="feed-name" className="text-sm font-medium">
                    Feed name
                  </label>

                  <input
                    id="feed-name"
                    type="text"
                    value={feedName}
                    onChange={(event) => {
                      setFeedName(event.target.value)
                      setFeedEditError(null)
                    }}
                    autoFocus
                    required
                    disabled={isUpdatingFeed}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
                  />
                </div>

                {feedEditError && (
                  <p role="alert" className="text-sm text-destructive">
                    {feedEditError}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditFeedDialogOpen(false)
                      setEditingFeedId(null)
                      setFeedEditError(null)
                    }}
                    disabled={isUpdatingFeed}
                    className="h-8 rounded-md border px-3 text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmRenameFeed}
                    disabled={!feedName.trim() || isUpdatingFeed}
                    className="h-8 rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isUpdatingFeed ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isMoveFeedDialogOpen}
              onOpenChange={(open: boolean) => {
                if (!open && !isUpdatingFeed) {
                  setIsMoveFeedDialogOpen(false)
                  setMovingFeedId(null)
                  setFeedMoveError(null)
                }
              }}
            >
              <DialogContent className="w-[calc(100%-2rem)] max-w-md p-6">
                <DialogHeader>
                  <DialogTitle>Move Feed</DialogTitle>
                  <DialogDescription>
                    Choose the category where you want to move{' '}
                    <strong>{movingFeed?.name}</strong>.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="move-feed-category" className="text-sm font-medium">
                    Category
                  </label>

                  <select
                    id="move-feed-category"
                    value={targetCategoryId}
                    onChange={(event) => {
                      setTargetCategoryId(event.target.value)
                      setFeedMoveError(null)
                    }}
                    disabled={isUpdatingFeed}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
                  >
                    <option value="">No category</option>

                    {categories
                      .filter((category) => category.id !== movingFeed?.category_id)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                  </select>
                </div>

                {feedMoveError && (
                  <p role="alert" className="text-sm text-destructive">
                    {feedMoveError}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoveFeedDialogOpen(false)
                      setMovingFeedId(null)
                      setFeedMoveError(null)
                    }}
                    disabled={isUpdatingFeed}
                    className="h-8 rounded-md border px-3 text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmMoveFeed}
                    disabled={isUpdatingFeed || !movingFeed}
                    className="h-8 rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isUpdatingFeed ? 'Moving…' : 'Move feed'}
                  </button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={deletingFeedId !== null}
              onOpenChange={(open: boolean) => {
                if (!open && !isDeletingFeed) {
                  setDeletingFeedId(null)
                  setFeedDeleteError(null)
                }
              }}
            >
              <DialogContent className="w-[calc(100%-2rem)] max-w-md p-6">
                <DialogHeader>
                  <DialogTitle>Delete Feed</DialogTitle>
                  <DialogDescription>
                    <p>
                      Are you sure you want to delete{' '}
                      <strong>{deletingFeed?.name}</strong>?
                    </p>
                    <p>
                      This will permanently delete the feed and all its
                      synced articles.
                    </p>
                    <p>
                      <strong>This action cannot be undone.</strong>
                    </p>
                  </DialogDescription>
                </DialogHeader>

                {feedDeleteError && (
                  <p role="alert" className="text-sm text-destructive">
                    {feedDeleteError}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={isDeletingFeed}
                    onClick={() => {
                      setDeletingFeedId(null)
                      setFeedDeleteError(null)
                    }}
                    className="rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={isDeletingFeed || !deletingFeed}
                    onClick={handleConfirmDeleteFeed}
                    className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray/70 disabled:opacity-50"
                  >
                    {isDeletingFeed ? 'Deleting…' : 'Delete feed'}
                  </button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isAddFeedDialogOpen}
              onOpenChange={setIsAddFeedDialogOpen}
            >
              <DialogContent className="w-[calc(100%-2rem)] max-w-md p-6">
                <DialogHeader>
                  <DialogTitle>Add New Feed</DialogTitle>
                  <DialogDescription>
                    Enter the URL of an RSS or Atom feed.
                  </DialogDescription>
                </DialogHeader>

                <AddFeedForm
                  categories={categories}
                  initialCategoryId={selectedCategoryId}
                  onCancel={() => setIsAddFeedDialogOpen(false)}
                  onSubmit={async (url, categoryId) => {
                    await onAddFeed(url, categoryId)
                    setIsAddFeedDialogOpen(false)
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>

          <SidebarMenu>
            {categories.map((category) => {
              const categoryFeeds = sources.filter(
                (source) => source.category_id === category.id,
              )

              return (
                <Collapsible
                  key={category.id}
                  className="group/collapsible"
                >
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
                            className={`absolute right-16 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-sidebar-foreground/70 opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-hover/category:opacity-100`}
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
                              onClick={() => {
                                setEditingCategoryId(category.id)
                                setIsEditDialogOpen(true)
                              }}
                              className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                            >
                              <Pencil className="size-4" />
                              <span>Rename category</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null)
                                setDeletingCategoryId(category.id)
                              }}
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
                        onClick={() => {
                          setSelectedCategoryId(category.id)
                          setIsAddFeedDialogOpen(true)
                        }}
                        className={`absolute right-8 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-sidebar-foreground/70 opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-hover/category:opacity-100`}
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
                            <SidebarMenuSubItem key={source.id}>
                              <div className="group/feed relative">
                                <SidebarMenuSubButton
                                  isActive={selectedItem === `feed:${source.id}`}
                                  onClick={() => onSelectItem(`feed:${source.id}`)}
                                  className="pr-10"
                                >
                                  <span className="min-w-0 flex-1 truncate">
                                    {source.name}
                                  </span>
                                </SidebarMenuSubButton>

                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button
                                      type="button"
                                      aria-label={`Manage ${source.name}`}
                                      className="absolute right-1 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-sidebar-foreground/70 opacity-0 transition-opacity hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring group-hover/feed:opacity-100"
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
                                        onClick={() => {
                                          setEditingFeedId(source.id)
                                          setFeedName(source.name)
                                          setFeedEditError(null)
                                          setIsEditFeedDialogOpen(true)
                                        }}
                                        className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                                      >
                                        <Pencil className="size-4" />
                                        <span>Rename feed</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMovingFeedId(source.id)
                                          setTargetCategoryId('')
                                          setFeedMoveError(null)
                                          setIsMoveFeedDialogOpen(true)
                                        }}
                                        className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                                      >
                                        <Folder className="size-4" />
                                        <span>Move feed</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setFeedDeleteError(null)
                                          setDeletingFeedId(source.id)
                                        }}
                                        className="flex items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-destructive hover:bg-accent"
                                      >
                                        <Trash2 className="size-4" />
                                        <span>Delete feed</span>
                                      </button>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    )}
                  </SidebarMenuItem>
                </Collapsible>
              )
            })}

            {/* Feeds that don't belong to any category */}
            {sources
              .filter((source) => source.category_id === null)
              .map((source) => (
                <SidebarMenuItem key={source.id}>
                  <SidebarMenuButton
                    isActive={selectedItem === `feed:${source.id}`}
                    onClick={() => onSelectItem(`feed:${source.id}`)}
                  >
                    <span className="w-4 shrink-0" />
                    <span>{source.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}

export default AppSidebar
