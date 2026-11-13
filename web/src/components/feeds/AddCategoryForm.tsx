import { useState, type SubmitEvent } from 'react'

type AddCategoryFormProps = {
  onCancel: () => void
  onSubmit: (name: string) => Promise<void>
}

function AddCategoryForm({
  onCancel,
  onSubmit,
}: AddCategoryFormProps) {
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedName = name.trim()

    if (!trimmedName || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(trimmedName)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not create the category. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category-name" className="text-sm font-medium">
          Title
        </label>

        <input
          id="category-name"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setError(null)
          }}
          placeholder="e.g. Technology"
          autoFocus
          required
          disabled={isSubmitting}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
        />

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-8 rounded-md border px-3 text-sm hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="h-8 rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? 'Creating…' : 'Create'}
        </button>
      </div>
    </form>
  )
}

export default AddCategoryForm