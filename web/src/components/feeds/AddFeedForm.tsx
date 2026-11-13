
import { useState, type SubmitEvent } from 'react'

import type { Category } from '@/api/categories'

type AddFeedFormProps = {
  categories: Category[]
  onCancel: () => void
  onSubmit: (url: string, categoryId: string | null) => Promise<void>
}

function AddFeedForm({
  categories,
  onCancel,
  onSubmit,
}: AddFeedFormProps) {
  const [url, setUrl] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedUrl = url.trim()

    if (!trimmedUrl || isSubmitting) return

    let parsedUrl: URL

    try {
      parsedUrl = new URL(trimmedUrl)

      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol')
      }
    } catch {
      setError('Please enter a valid HTTP or HTTPS URL.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(trimmedUrl, categoryId || null)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Could not add the feed. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="feed-url" className="text-sm font-medium">
          Feed URL
        </label>

        <input
          id="feed-url"
          type="url"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value)
            setError(null)
          }}
          placeholder="https://example.com/feed.xml"
          autoFocus
          required
          disabled={isSubmitting}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="feed-category" className="text-sm font-medium">
          Category
        </label>

        <select
          id="feed-category"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          disabled={isSubmitting}
          className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:opacity-50"
        >
          <option value="">No category</option>

          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

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
          disabled={!url.trim() || isSubmitting}
          className="h-8 rounded-md bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? 'Adding…' : 'Add feed'}
        </button>
      </div>
    </form>
  )
}

export default AddFeedForm
