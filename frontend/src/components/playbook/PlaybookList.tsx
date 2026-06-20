'use client'

import { ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Plus } from 'lucide-react'
import { PlaybookCategory, PlaybookItem } from './PlaybookItemModal'

type Props = {
  category: PlaybookCategory
  title: string
  subtitle?: string
  renderItems: (items: PlaybookItem[], opts: { canEdit: boolean; onEdit: (i: PlaybookItem) => void; onDelete: (i: PlaybookItem) => void }) => ReactNode
  emptyMessage?: string
  onAdd: () => void
  onEdit: (item: PlaybookItem) => void
}

export function PlaybookList({ category, title, subtitle, renderItems, emptyMessage, onAdd, onEdit }: Props) {
  const { hasRole } = useAuth()
  const canEdit = hasRole('ADMIN', 'SUPERADMIN')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['playbook', category],
    queryFn: () => api.get('/playbook', { params: { category } }).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/playbook/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playbook', category] }),
  })

  const items: PlaybookItem[] = data?.items || []

  const handleDelete = (item: PlaybookItem) => {
    if (confirm(`Delete "${item.title}"?`)) {
      deleteMutation.mutate(item.id)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          {subtitle && <p className="text-zinc-500 text-xs mt-1">{subtitle}</p>}
        </div>
        {canEdit && (
          <button
            onClick={onAdd}
            className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-3 py-2 rounded-lg text-xs transition-colors"
          >
            <Plus size={13} /> Add
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-zinc-900/60 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-zinc-500 bg-zinc-900/40 border border-zinc-800 rounded-xl">
          <div className="text-sm mb-2">{emptyMessage || 'Nothing here yet.'}</div>
          {canEdit && (
            <button
              onClick={onAdd}
              className="text-xs text-yellow-400 hover:text-yellow-300 underline underline-offset-2"
            >
              Add the first one
            </button>
          )}
        </div>
      ) : (
        renderItems(items, {
          canEdit,
          onEdit,
          onDelete: handleDelete,
        })
      )}
    </div>
  )
}
