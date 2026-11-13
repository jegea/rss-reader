import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

function AppHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
      <SidebarTrigger />

      <Separator orientation="vertical" className="h-5" />

      <span className="text-sm text-muted-foreground">
        Your RSS Reader
      </span>
    </header>
  )
}

export default AppHeader