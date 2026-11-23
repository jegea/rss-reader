import type { ReactNode } from 'react'

import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'

import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import type { Category } from '@/api/categories'
import type { Source } from '@/api/sources'

type MainLayoutProps = {
  children: ReactNode
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

function MainLayout({
  children,
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
}: MainLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        selectedItem={selectedItem}
        onSelectItem={onSelectItem}
        categories={categories}
        sources={sources}
        onOpenAddCategory={onOpenAddCategory}
        onOpenGlobalAddFeed={onOpenGlobalAddFeed}
        onOpenRenameCategory={onOpenRenameCategory}
        onOpenDeleteCategory={onOpenDeleteCategory}
        onOpenAddFeed={onOpenAddFeed}
        onOpenRenameFeed={onOpenRenameFeed}
        onOpenMoveFeed={onOpenMoveFeed}
        onOpenDeleteFeed={onOpenDeleteFeed}
      />

      <SidebarInset>
        <AppHeader />

        <main className="min-h-0 flex-1 overflow-y-auto bg-background text-foreground">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default MainLayout
