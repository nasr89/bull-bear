'use client'

import { ReactNode } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PlaybookCategory, PlaybookItem } from './PlaybookItemModal'

type SortableListProps = {
  category: PlaybookCategory
  items: PlaybookItem[]
  enabled: boolean
  strategy?: 'vertical' | 'grid'
  children: (orderedItems: PlaybookItem[]) => ReactNode
}

export function SortableList({ category, items, enabled, strategy = 'vertical', children }: SortableListProps) {
  const qc = useQueryClient()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) => api.post('/playbook/reorder', { ids }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playbook', category] }),
  })

  if (!enabled) {
    return <>{children(items)}</>
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = arrayMove(items, oldIndex, newIndex)

    // Optimistic update on the cached query
    qc.setQueryData(['playbook', category], (old: any) => {
      if (!old) return old
      return { ...old, items: newOrder }
    })

    reorderMutation.mutate(newOrder.map(i => i.id))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={items.map(i => i.id)}
        strategy={strategy === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
      >
        {children(items)}
      </SortableContext>
    </DndContext>
  )
}

// Wraps a single child in the sortable transform/transition + offers a drag handle.
// Use renderHandle to render the grip icon wherever it makes sense in the card.
type SortableItemProps = {
  id: string
  enabled: boolean
  children: (opts: { dragHandleProps: any; isDragging: boolean }) => ReactNode
}

export function SortableItem({ id, enabled, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !enabled })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {children({
        dragHandleProps: enabled ? { ...listeners, style: { cursor: 'grab' } } : {},
        isDragging,
      })}
    </div>
  )
}

export function DragHandle({ dragHandleProps }: { dragHandleProps: any }) {
  return (
    <button
      type="button"
      {...dragHandleProps}
      className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors cursor-grab active:cursor-grabbing"
      title="Drag to reorder"
      onClick={e => e.preventDefault()}
    >
      <GripVertical size={14} />
    </button>
  )
}
