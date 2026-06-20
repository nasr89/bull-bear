'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type PlaybookCategory = 'FOLLOWUP_SCRIPT' | 'WHATSAPP_MESSAGE' | 'OBJECTION' | 'PRO_TIP'

export type PlaybookItem = {
  id: string
  category: PlaybookCategory
  title: string
  body: string
  tag?: string | null
  tagColor?: string | null
  sortOrder: number
}

type Props = {
  open: boolean
  category: PlaybookCategory
  item?: PlaybookItem
  onClose: () => void
}

const EMPTY = {
  title: '',
  body: '',
  tag: '',
  tagColor: 'gold' as 'gold' | 'green' | 'gray' | 'red',
  sortOrder: 0,
}

const CATEGORY_LABELS: Record<PlaybookCategory, { create: string; edit: string }> = {
  FOLLOWUP_SCRIPT: { create: 'New Follow-Up Script', edit: 'Edit Follow-Up Script' },
  WHATSAPP_MESSAGE: { create: 'New WhatsApp Message', edit: 'Edit WhatsApp Message' },
  OBJECTION: { create: 'New Objection', edit: 'Edit Objection' },
  PRO_TIP: { create: 'New Pro Tip', edit: 'Edit Pro Tip' },
}

const PLACEHOLDERS: Record<PlaybookCategory, { title: string; body: string; tag?: string }> = {
  FOLLOWUP_SCRIPT: { title: 'First Follow-Up — Check In', body: 'Marhaba [Name]...', tag: 'Day 2-3' },
  WHATSAPP_MESSAGE: { title: 'Day 1 — First Contact', body: 'Hi [Name] 👋...' },
  OBJECTION: { title: 'Ma 3andi flous — I don\'t have money', body: 'That\'s completely fine! We have accounts that start with very small amounts...' },
  PRO_TIP: { title: 'Trust First, Sell Second', body: 'Lebanese clients buy from people they trust...', tag: '🤝' },
}

export function PlaybookItemModal({ open, category, item, onClose }: Props) {
  const qc = useQueryClient()
  const isEdit = !!item
  const [form, setForm] = useState(EMPTY)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title,
        body: item.body,
        tag: item.tag || '',
        tagColor: (item.tagColor as any) || 'gold',
        sortOrder: item.sortOrder,
      })
    } else {
      setForm(EMPTY)
    }
    setFormError('')
  }, [item, open])

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: form.title.trim(),
        body: form.body,
        sortOrder: Number(form.sortOrder) || 0,
      }
      if (category === 'FOLLOWUP_SCRIPT' || category === 'PRO_TIP') {
        payload.tag = form.tag.trim() || null
      }
      if (category === 'FOLLOWUP_SCRIPT') {
        payload.tagColor = form.tagColor
      }
      if (isEdit && item) {
        return api.put(`/playbook/${item.id}`, payload)
      }
      return api.post('/playbook', { category, ...payload })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbook', category] })
      onClose()
    },
    onError: (e: any) => {
      const msg =
        e?.response?.data?.errors?.[0]?.msg ||
        e?.response?.data?.error ||
        'Request failed'
      setFormError(msg)
    },
  })

  if (!open) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (form.title.trim().length < 2) { setFormError('Title is too short'); return }
    if (form.body.trim().length < 2) { setFormError('Body is required'); return }
    mutation.mutate()
  }

  const labels = CATEGORY_LABELS[category]
  const placeholders = PLACEHOLDERS[category]

  const showTag = category === 'FOLLOWUP_SCRIPT' || category === 'PRO_TIP'
  const showTagColor = category === 'FOLLOWUP_SCRIPT'
  const tagLabel = category === 'PRO_TIP' ? 'Icon (emoji)' : 'Tag'
  const titleLabel = category === 'OBJECTION' ? 'Objection / question' : 'Title'
  const bodyLabel = category === 'OBJECTION' ? 'Recommended response' : 'Body'

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="font-bold text-yellow-400">{isEdit ? labels.edit : labels.create}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{titleLabel} *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
              placeholder={placeholders.title}
            />
          </div>

          {showTag && (
            <div className={showTagColor ? 'grid grid-cols-2 gap-4' : ''}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{tagLabel}</label>
                <input
                  value={form.tag}
                  onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
                  placeholder={placeholders.tag || ''}
                />
              </div>
              {showTagColor && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Tag color</label>
                  <select
                    value={form.tagColor}
                    onChange={e => setForm(f => ({ ...f, tagColor: e.target.value as any }))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
                  >
                    <option value="gold">Gold</option>
                    <option value="green">Green</option>
                    <option value="gray">Gray</option>
                    <option value="red">Red</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">{bodyLabel} *</label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              required
              rows={category === 'PRO_TIP' || category === 'OBJECTION' ? 4 : 8}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500 resize-none font-sans"
              placeholder={placeholders.body}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Sort order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-yellow-500"
            />
            <p className="text-xs text-zinc-500 mt-1">Lower numbers appear first.</p>
          </div>

          {formError && (
            <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">{formError}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-zinc-700 text-zinc-400 rounded-lg py-2.5 text-sm hover:border-zinc-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
