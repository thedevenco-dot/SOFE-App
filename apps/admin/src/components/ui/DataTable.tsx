'use client';

import React, { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { Search, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Button } from './Button';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = 'Search records...',
  pageSize = 10,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display right now.',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Actions Bar */}
      {searchKey && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-slate)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              width: '100%',
              maxWidth: '360px',
            }}
          >
            <Search size={16} color="var(--color-muted)" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--color-white)',
                fontSize: '13px',
                width: '100%',
              }}
            />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
            Showing {table.getFilteredRowModel().rows.length} records
          </div>
        </div>
      )}

      {/* Table Container */}
      <div
        style={{
          overflowX: 'auto',
          backgroundColor: 'var(--color-slate)',
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        <table
          style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                style={{
                  borderBottom: '1px solid var(--color-border-subtle)',
                  backgroundColor: 'rgba(6, 30, 48, 0.4)',
                }}
              >
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{
                        padding: '12px 16px',
                        color: 'var(--color-muted)',
                        fontWeight: 600,
                        fontSize: '12px',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        cursor: isSortable ? 'pointer' : 'default',
                        userSelect: 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sortDir === 'asc' && <ChevronUp size={14} color="var(--color-orange)" />}
                        {sortDir === 'desc' && (
                          <ChevronDown size={14} color="var(--color-orange)" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {isLoading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, idx) => (
                <tr
                  key={`loading-${idx}`}
                  style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
                >
                  {columns.map((_, colIdx) => (
                    <td key={`col-${colIdx}`} style={{ padding: '16px' }}>
                      <div
                        style={{
                          height: '14px',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '4px',
                          width: `${50 + (colIdx % 3) * 20}%`,
                          animation: 'pulse 1.5s ease-in-out infinite',
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  style={{
                    borderBottom: '1px solid var(--color-border-subtle)',
                    transition: 'background-color 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={{ padding: '14px 16px', color: 'var(--color-white)' }}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              // Empty State
              <tr>
                <td colSpan={columns.length} style={{ padding: '48px 16px', textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--color-muted)',
                    }}
                  >
                    <Inbox size={32} strokeWidth={1.5} />
                    <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-white)' }}>
                      {emptyTitle}
                    </p>
                    <p style={{ fontSize: '13px', maxWidth: '320px' }}>{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && table.getPageCount() > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '13px',
            color: 'var(--color-muted)',
            padding: '4px 8px',
          }}
        >
          <div>
            Page{' '}
            <span style={{ color: 'var(--color-white)', fontWeight: 600 }}>
              {table.getState().pagination.pageIndex + 1}
            </span>{' '}
            of{' '}
            <span style={{ color: 'var(--color-white)', fontWeight: 600 }}>
              {table.getPageCount()}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
