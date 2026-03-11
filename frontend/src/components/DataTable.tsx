'use client'

import { useState, type ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export interface ColumnDef<T> {
  key: keyof T | string
  header: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  render?: (row: T) => ReactNode
}

interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[]
  data: T[]
  rowKey: keyof T
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

type SortDir = 'asc' | 'desc' | null

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey,
  onRowClick,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  function handleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc')
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null) }
      else setSortDir('asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0
    const av = a[sortKey]
    const bv = b[sortKey]
    if (av == null) return 1
    if (bv == null) return -1
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-[#1E293B]">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`py-3 px-4 text-[11px] text-[#475569] font-medium uppercase tracking-wider select-none ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                } ${col.sortable ? 'cursor-pointer hover:text-[#94A3B8] transition-colors' : ''}`}
                onClick={() => col.sortable && handleSort(String(col.key))}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && (
                    <span className="opacity-50">
                      {sortKey === String(col.key) ? (
                        sortDir === 'asc' ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="w-3 h-3" />
                      )}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm">
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-[#475569]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row, idx) => (
              <tr
                key={String(row[rowKey])}
                className={`border-b border-[#1E293B]/50 transition-colors ${
                  idx % 2 === 1 ? 'bg-[#1A1A24]' : 'bg-[#16161F]'
                } ${onRowClick ? 'cursor-pointer hover:bg-[#1E293B]/60' : 'hover:bg-[#1E293B]/30'}`}
                style={{ height: '40px' }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={`px-4 py-2.5 text-[#F8FAFC] ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {col.render
                      ? col.render(row)
                      : String(row[String(col.key)] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
