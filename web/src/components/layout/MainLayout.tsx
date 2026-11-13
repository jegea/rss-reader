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
  onAddCategory: (name: string) => Promise<Category>
  onAddFeed: (url: string, categoryId: string | null) => Promise<Source>
}

function MainLayout({
  children,
  selectedItem,
  onSelectItem,
  categories,
  sources,
  onAddCategory,
  onAddFeed,
}: MainLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        selectedItem={selectedItem}
        onSelectItem={onSelectItem}
        categories={categories}
        sources={sources}
        onAddCategory={onAddCategory}
        onAddFeed={onAddFeed}
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
