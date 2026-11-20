import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import type { Category } from '@/api/categories'

import AddCategoryForm from '@/components/feeds/AddCategoryForm'

type CategoryDialogsProps = {
  categories: Category[]

  isAddDialogOpen: boolean
  setIsAddDialogOpen: (open: boolean) => void

  isEditDialogOpen: boolean
  setIsEditDialogOpen: (open: boolean) => void
  editingCategoryId: string | null

  deletingCategoryId: string | null
  setDeletingCategoryId: (id: string | null) => void
  deleteError: string | null
  setDeleteError: (error: string | null) => void
  isDeletingCategory: boolean

  onAddCategory: (name: string) => Promise<Category>
  onUpdateCategory: (id: string, name: string) => Promise<Category>
  onConfirmDeleteCategory: () => void
}

function CategoryDialogs({
  categories,
  isAddDialogOpen,
  setIsAddDialogOpen,
  isEditDialogOpen,
  setIsEditDialogOpen,
  editingCategoryId,
  deletingCategoryId,
  setDeletingCategoryId,
  deleteError,
  setDeleteError,
  isDeletingCategory,
  onAddCategory,
  onUpdateCategory,
  onConfirmDeleteCategory,
}: CategoryDialogsProps) {
  const deletingCategory = categories.find(
    (category) => category.id === deletingCategoryId,
  )

  return (
    <>
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
              <p>
                Are you sure you want to delete{' '}
                <strong>{deletingCategory?.name}</strong>?
              </p>
              <p>
                This will permanently delete all feeds assigned to this
                category and all articles.
              </p>
              <p>
                <strong>This action cannot be undone.</strong>
              </p>
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
              onClick={onConfirmDeleteCategory}
              className="rounded-md bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray/70 disabled:opacity-50"
            >
              {isDeletingCategory ? 'Deleting…' : 'Delete category'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CategoryDialogs