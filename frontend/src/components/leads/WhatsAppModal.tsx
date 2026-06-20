'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { ExternalLink, Send } from 'lucide-react'
import type { Lead } from './LeadFormModal'

type PlaybookItem = {
  id: string
  title: string
  body: string
}

type Props = {
  open: boolean
  lead?: Lead
  onClose: () => void
}

// Strip everything but digits from a phone string, removing leading + or 00.
function toE164(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  return digits
}

function fillPlaceholders(template: string, lead: Lead | undefined, userName: string): string {
  if (!template) return ''
  const leadFirstName = lead?.name?.split(/\s+/)[0] || 'there'
  const myFirstName = userName.split(/\s+/)[0] || 'me'
  return template
    .replace(/\[Name\]/g, leadFirstName)
    .replace(/\[Your Name\]/g, myFirstName)
}

export function WhatsAppModal({ open, lead, onClose }: Props) {
  const { user } = useAuth()
  const [selectedScriptId, setSelectedScriptId] = useState<string>('')
  const [text, setText] = useState('')

  // Fetch BOTH WhatsApp messages and follow-up scripts when modal opens
  const { data: waData } = useQuery({
    queryKey: ['playbook', 'WHATSAPP_MESSAGE'],
    queryFn: () => api.get('/playbook', { params: { category: 'WHATSAPP_MESSAGE' } }).then(r => r.data),
    enabled: open,
    staleTime: 60_000,
  })
  const { data: fuData } = useQuery({
    queryKey: ['playbook', 'FOLLOWUP_SCRIPT'],
    queryFn: () => api.get('/playbook', { params: { category: 'FOLLOWUP_SCRIPT' } }).then(r => r.data),
    enabled: open,
    staleTime: 60_000,
  })

  const scripts = useMemo(() => {
    const wa: PlaybookItem[] = (waData?.items || []).map((i: any) => ({ ...i, _group: 'WhatsApp' }))
    const fu: PlaybookItem[] = (fuData?.items || []).map((i: any) => ({ ...i, _group: 'Follow-Up' }))
    return [...wa, ...fu]
  }, [waData, fuData])

  // When a script is picked, fill the textarea
  useEffect(() => {
    if (!open) return
    if (!selectedScriptId) {
      setText('')
      return
    }
    const item = scripts.find(s => s.id === selectedScriptId)
    if (item) setText(fillPlaceholders(item.body, lead, user?.name || ''))
  }, [selectedScriptId, scripts, lead, user?.name, open])

  // Reset when modal opens for a new lead
  useEffect(() => {
    if (open) {
      setSelectedScriptId('')
      setText('')
    }
  }, [open, lead?.id])

  if (!open || !lead) return null

  const phoneDigits = toE164(lead.phone || '')
  const canSend = phoneDigits.length > 0 && text.trim().length > 0
  const waUrl = canSend
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`
    : ''

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-green-400 flex items-center gap-2">
              <Send size={16} /> WhatsApp {lead.name}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">
              {lead.phone || <span className="text-red-400">No phone on file</span>}
            </p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {!lead.phone ? (
            <div className="bg-red-950/40 border border-red-800/50 rounded-lg p-4 text-sm text-red-300">
              This lead has no phone number. Add one in the lead form first, then come back here.
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Pick a script (optional)
                </label>
                <select
                  value={selectedScriptId}
                  onChange={e => setSelectedScriptId(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                >
                  <option value="">— Start from blank —</option>
                  <optgroup label="WhatsApp Sequence">
                    {scripts.filter((s: any) => s._group === 'WhatsApp').map((s: any) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Follow-Up Scripts">
                    {scripts.filter((s: any) => s._group === 'Follow-Up').map((s: any) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-xs text-zinc-500 mt-1.5">
                  Placeholders like <code className="text-yellow-400">[Name]</code> and <code className="text-yellow-400">[Your Name]</code> are filled in automatically.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Message preview (you can edit before sending)
                </label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  rows={10}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-green-500 resize-none font-sans"
                  placeholder="Type a message or pick a script above…"
                />
                <p className="text-xs text-zinc-500 mt-1.5">{text.length} characters</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-zinc-700 text-zinc-400 rounded-lg py-2.5 text-sm hover:border-zinc-600 transition-colors"
                >
                  Cancel
                </button>
                <a
                  href={canSend ? waUrl : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { if (canSend) setTimeout(onClose, 200) }}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-colors ${
                    canSend
                      ? 'bg-green-500 hover:bg-green-400 text-black cursor-pointer'
                      : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }`}
                  aria-disabled={!canSend}
                >
                  <ExternalLink size={14} /> Open in WhatsApp
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
