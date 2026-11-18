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

  const deletingCategory = categories.find(
    (category) => category.id === deletingCategoryId,
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
                              <SidebarMenuSubButton
                                isActive={selectedItem === `feed:${source.id}`}
                                onClick={() => onSelectItem(`feed:${source.id}`)}
                              >
                                <span>{source.name}</span>
                              </SidebarMenuSubButton>
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
