import { type ReactNode } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { Spin } from './Spin'
import { Empty } from './Empty'
import { cn } from './cn'

export interface TableProps<T> {
  columns: ColumnDef<T, any>[]
  data: T[]
  rowKey?: string | ((record: T) => string | number)
  loading?: boolean
  className?: string
}

// 数据表格（基于 @tanstack/react-table）
export function Table<T>({
  columns,
  data,
  rowKey = 'id',
  loading,
  className,
}: TableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const getKey = (row: T) =>
    typeof rowKey === 'function' ? rowKey(row) : (row as any)[rowKey]

  return (
    <div className={cn('relative', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-gray-50 border-b border-gray-200">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left font-medium text-gray-600 whitespace-nowrap"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext()) as ReactNode}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={getKey(row.original)}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-gray-700 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext()) as ReactNode}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
          <Spin />
        </div>
      )}
      {!loading && data.length === 0 && <Empty />}
    </div>
  )
}
