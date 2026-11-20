import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type { Category } from '@/api/categories'
import type { Source } from '@/api/sources'

import AddFeedForm from '@/components/feeds/AddFeedForm'

type FeedDialogsProps = {
  categories: Category[]
  sources: Source[]

  isAddFeedDialogOpen: boolean
  setIsAddFeedDialogOpen: (open: boolean) => void
  selectedCategoryId: string | null
  onAddFeed: (url: string, categoryId: string | null) => Promise<Source>

  isEditFeedDialogOpen: boolean
  setIsEditFeedDialogOpen: (open: boolean) => void
  setEditingFeedId: (id: string | null) => void
  feedName: string
  setFeedName: (name: string) => void
  feedEditError: string | null
  setFeedEditError: (error: string | null) => void
  isUpdatingFeed: boolean
  onRenameFeed: () => void

  isMoveFeedDialogOpen: boolean
  setIsMoveFeedDialogOpen: (open: boolean) => void
  movingFeedId: string | null
  setMovingFeedId: (id: string | null) => void
  targetCategoryId: string
  setTargetCategoryId: (id: string) => void
  feedMoveError: string | null
  setFeedMoveError: (error: string | null) => void
  onMoveFeed: () => void

  deletingFeedId: string | null
  setDeletingFeedId: (id: string | null) => void
  feedDeleteError: string | null
  setFeedDeleteError: (error: string | null) => void
  isDeletingFeed: boolean
  onDeleteFeed: () => void
}

function FeedDialogs({
  categories,
  sources,
  isAddFeedDialogOpen,
  setIsAddFeedDialogOpen,
  selectedCategoryId,
  onAddFeed,
  isEditFeedDialogOpen,
  setIsEditFeedDialogOpen,
  setEditingFeedId,
  feedName,
  setFeedName,
  feedEditError,
  setFeedEditError,
  isUpdatingFeed,
  onRenameFeed,
  isMoveFeedDialogOpen,
  setIsMoveFeedDialogOpen,
  movingFeedId,
  setMovingFeedId,
  targetCategoryId,
  setTargetCategoryId,
  feedMoveError,
  setFeedMoveError,
  onMoveFeed,
  deletingFeedId,
  setDeletingFeedId,
  feedDeleteError,
  setFeedDeleteError,
  isDeletingFeed,
  onDeleteFeed,
}: FeedDialogsProps) {
  const movingFeed = sources.find(
    (source) => source.id === movingFeedId,
  )

  const deletingFeed = sources.find(
    (source) => source.id === deletingFeedId,
  )

  return (
    <>
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
              onClick={onRenameFeed}
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
              onClick={onMoveFeed}
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
              onClick={onDeleteFeed}
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
    </>
  )
}

export default FeedDialogs