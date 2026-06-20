'use client'

import { useState } from 'react'
import { Copy, Check, Edit, Trash2 } from 'lucide-react'

const TAG_COLORS: Record<string, string> = {
  gold: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  green: 'bg-green-500/10 text-green-400 border-green-500/30',
  gray: 'bg-zinc-700/40 text-zinc-300 border-zinc-700',
  red: 'bg-red-500/10 text-red-400 border-red-500/30',
}

type Props = {
  title: string
  body: string
  tag?: string | null
  tagColor?: string | null
  onEdit?: () => void
  onDelete?: () => void
}

export function ScriptCard({ title, body, tag, tagColor, onEdit, onDelete }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(body)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const tagClass = TAG_COLORS[tagColor || 'gray'] || TAG_COLORS.gray

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          {tag && (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${tagClass}`}>
              {tag}
            </span>
          )}
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-yellow-400 transition-colors"
              title="Edit"
            >
              <Edit size={14} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              copied
                ? 'bg-green-500/20 text-green-400'
                : 'bg-zinc-800 text-zinc-300 hover:bg-yellow-500 hover:text-black'
            }`}
            title="Copy to clipboard"
          >
            {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
          </button>
        </div>
      </div>
      <pre className="px-5 py-4 text-sm text-zinc-200 whitespace-pre-wrap font-sans border-l-2 border-yellow-500/40 leading-relaxed">
{body}
      </pre>
    </div>
  )
}
