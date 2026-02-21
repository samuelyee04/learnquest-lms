'use client'
// src/components/programs/CategoryBar.tsx

import { Category } from '@/types'

interface Props {
  categories:  Category[]
  activeId:    string | null
  onSelect:    (id: string | null) => void
}

export default function CategoryBar({ categories, activeId, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-3 pb-2 px-1">
      {/* All button */}
      <button
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold font-mono uppercase tracking-widest transition-all ${
          !activeId
            ? 'bg-gradient-to-r from-cyan-400 to-blue-400 text-[#0a0a14] shadow-lg shadow-cyan-500/25'
            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
        }`}
      >
        ✨ All
      </button>

      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          style={
            activeId === cat.id
              ? { background: cat.color, boxShadow: `0 4px 20px ${cat.color}44` }
              : {}
          }
          className={`flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-bold font-mono uppercase tracking-widest transition-all ${
            activeId === cat.id
              ? 'text-[#0a0a14]'
              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
          }`}
        >
          {cat.icon} {cat.name}
        </button>
      ))}
    </div>
  )
}