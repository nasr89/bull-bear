'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { MessageSquare, Phone, Shield, Lightbulb, Edit, Trash2 } from 'lucide-react'
import DashboardLayout from '../dashboard/layout'
import { ScriptCard } from '@/components/playbook/ScriptCard'
import { PlaybookList } from '@/components/playbook/PlaybookList'
import {
  PlaybookItemModal,
  type PlaybookCategory,
  type PlaybookItem,
} from '@/components/playbook/PlaybookItemModal'

type TabKey = 'followup' | 'whatsapp' | 'objections' | 'tips'

const TABS: { key: TabKey; label: string; icon: any; category: PlaybookCategory }[] = [
  { key: 'followup', label: 'Follow-Up Scripts', icon: Phone, category: 'FOLLOWUP_SCRIPT' },
  { key: 'whatsapp', label: 'WhatsApp Sequence', icon: MessageSquare, category: 'WHATSAPP_MESSAGE' },
  { key: 'objections', label: 'Objections', icon: Shield, category: 'OBJECTION' },
  { key: 'tips', label: 'Pro Tips', icon: Lightbulb, category: 'PRO_TIP' },
]

function PlaybookPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = (searchParams.get('tab') as TabKey | null) || 'followup'
  const [tab, setTab] = useState<TabKey>(tabParam)

  // Modal state — one modal, opens for the current tab's category
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PlaybookItem | undefined>()

  useEffect(() => {
    setTab(tabParam)
  }, [tabParam])

  const switchTab = (key: TabKey) => {
    setTab(key)
    router.replace(`/playbook?tab=${key}`, { scroll: false })
  }

  const currentCategory = TABS.find(t => t.key === tab)!.category

  const openAdd = () => { setEditing(undefined); setModalOpen(true) }
  const openEdit = (item: PlaybookItem) => { setEditing(item); setModalOpen(true) }

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Playbook</h1>
          <p className="text-zinc-400 text-sm mt-1">Sales scripts, sequences & guidance</p>
        </div>

        {/* Tab bar */}
        <div className="border-b border-zinc-800 mb-8 flex gap-1 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => switchTab(t.key)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'text-yellow-400 border-yellow-500'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                <Icon size={15} /> {t.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        {tab === 'followup' && (
          <PlaybookList
            category="FOLLOWUP_SCRIPT"
            title="Follow-Up Scripts"
            subtitle="Reusable messages for warming leads after first contact"
            emptyMessage="No follow-up scripts yet."
            onAdd={openAdd}
            onEdit={openEdit}
            renderItems={(items, { canEdit, onEdit, onDelete }) => (
              <div className="space-y-4">
                {items.map(item => (
                  <ScriptCard
                    key={item.id}
                    title={item.title}
                    body={item.body}
                    tag={item.tag}
                    tagColor={item.tagColor}
                    onEdit={canEdit ? () => onEdit(item) : undefined}
                    onDelete={canEdit ? () => onDelete(item) : undefined}
                  />
                ))}
              </div>
            )}
          />
        )}

        {tab === 'whatsapp' && (
          <PlaybookList
            category="WHATSAPP_MESSAGE"
            title="14-Day WhatsApp Sequence"
            subtitle="Drip nurturing messages for new contacts"
            emptyMessage="No WhatsApp sequence yet."
            onAdd={openAdd}
            onEdit={openEdit}
            renderItems={(items, { canEdit, onEdit, onDelete }) => (
              <ol className="relative border-l-2 border-zinc-800 ml-3 space-y-6 pl-6">
                {items.map((item, idx) => (
                  <li key={item.id} className="relative">
                    <span className="absolute -left-[37px] top-1 w-7 h-7 rounded-full bg-zinc-900 border-2 border-yellow-500 flex items-center justify-center text-xs font-bold text-yellow-400 font-mono">
                      {idx + 1}
                    </span>
                    <div className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">
                      {item.title}
                    </div>
                    <ScriptCard
                      title=""
                      body={item.body}
                      onEdit={canEdit ? () => onEdit(item) : undefined}
                      onDelete={canEdit ? () => onDelete(item) : undefined}
                    />
                  </li>
                ))}
              </ol>
            )}
          />
        )}

        {tab === 'objections' && (
          <PlaybookList
            category="OBJECTION"
            title="Objection Handling Guide"
            subtitle="Common Lebanese-market objections and how to respond"
            emptyMessage="No objections recorded yet."
            onAdd={openAdd}
            onEdit={openEdit}
            renderItems={(items, { canEdit, onEdit, onDelete }) => (
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="text-sm font-bold text-red-400 flex items-center gap-2">
                        <span>❌</span> <span>{item.title}</span>
                      </div>
                      {canEdit && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-yellow-400 transition-colors" title="Edit">
                            <Edit size={13} />
                          </button>
                          <button onClick={() => onDelete(item)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-zinc-300 leading-relaxed border-l-2 border-green-500/60 pl-4">
                      {item.body}
                    </div>
                  </div>
                ))}
              </div>
            )}
          />
        )}

        {tab === 'tips' && (
          <PlaybookList
            category="PRO_TIP"
            title="Pro Tips for Lebanon Market"
            subtitle="Field-tested wisdom for selling in Lebanon"
            emptyMessage="No tips yet."
            onAdd={openAdd}
            onEdit={openEdit}
            renderItems={(items, { canEdit, onEdit, onDelete }) => (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map(item => (
                  <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 relative group">
                    {canEdit && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-yellow-400 transition-colors" title="Edit">
                          <Edit size={12} />
                        </button>
                        <button onClick={() => onDelete(item)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                    {item.tag && <div className="text-2xl mb-3">{item.tag}</div>}
                    <h3 className="text-xs font-bold uppercase tracking-widest text-yellow-400 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            )}
          />
        )}

        <PlaybookItemModal
          open={modalOpen}
          category={currentCategory}
          item={editing}
          onClose={() => setModalOpen(false)}
        />
      </div>
    </DashboardLayout>
  )
}

export default function PlaybookPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">Loading...</div>}>
      <PlaybookPageContent />
    </Suspense>
  )
}
