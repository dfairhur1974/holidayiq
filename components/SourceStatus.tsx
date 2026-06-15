'use client'
import type { SearchResults } from '@/lib/types'
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SourceStatus({ sources }: { sources: SearchResults['sources'] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {sources.map(s => (
        <div
          key={s.name}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs',
            s.status === 'ok'         ? 'bg-green-50 text-green-700' :
            s.status === 'no-results' ? 'bg-gray-100 text-gray-500'  :
                                        'bg-red-50 text-red-600'
          )}
        >
          {s.status === 'ok'         ? <CheckCircle className="h-3 w-3" /> :
           s.status === 'no-results' ? <AlertCircle className="h-3 w-3" /> :
                                       <XCircle className="h-3 w-3" />
          }
          {s.name}
          {s.status === 'ok' && <span className="opacity-60">({s.count})</span>}
        </div>
      ))}
    </div>
  )
}
