import {
  ChevronRight,
  Folder,
  Inbox,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Star,
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
}

function AppSidebar({
  selectedItem,
  onSelectItem,
  categories,
  sources,
  onAddCategory,
  onAddFeed,
}: AppSidebarProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddFeedDialogOpen, setIsAddFeedDialogOpen] = useState(false)
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
                    <SidebarMenuButton
                      isActive={selectedItem === `category:${category.id}`}
                      onClick={() => onSelectItem(`category:${category.id}`)}
                    >
                      <Folder />
                      <span>{category.name}</span>
                    </SidebarMenuButton>

                    {categoryFeeds.length > 0 && (
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuAction>
                            <ChevronRight className="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            <span className="sr-only">
                              Expand or collapse {category.name}
                            </span>
                          </SidebarMenuAction>
                        </CollapsibleTrigger>

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
                      </>
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
