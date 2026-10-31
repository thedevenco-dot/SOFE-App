'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit,
  AlertCircle,
  Archive,
  FileText,
  File,
} from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { adminApiClient } from '../../lib/api-client';

export interface BookListItem {
  id: string;
  _id?: string;
  slug: string;
  title: string;
  author: string;
  coverUrl: string;
  format: 'pdf' | 'summary';
  categoryId?: { _id: string; name: string; slug: string };
  tags?: string[];
  isFree: boolean;
  priceInr?: number;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt?: string;
}

interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
}

export default function BooksListPage() {
  const router = useRouter();

  const [books, setBooks] = useState<BookListItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pricingFilter, setPricingFilter] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Load Categories for filter
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await adminApiClient.get<{ data: CategoryOption[] }>(
          '/admin/taxonomy/categories',
        );
        setCategories(res.data || []);
      } catch {
        // taxonomy load silent fallback
      }
    }
    loadCategories();
  }, []);

  // Fetch books
  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (formatFilter && formatFilter !== 'all') params.set('format', formatFilter);
      if (categoryFilter && categoryFilter !== 'all') params.set('categoryId', categoryFilter);
      if (pricingFilter === 'free') params.set('isFree', 'true');
      if (pricingFilter === 'paid') params.set('isFree', 'false');

      const url = `/admin/books${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await adminApiClient.get<{ data: BookListItem[]; meta: { total: number } }>(url);
      setBooks(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load books';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, formatFilter, categoryFilter, pricingFilter]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Bulk Actions
  const handleBulkAction = async (action: 'archive' | 'delete') => {
    if (selectedIds.length === 0) return;

    if (action === 'delete') {
      const confirmDelete = window.confirm(
        `Are you sure you want to permanently delete ${selectedIds.length} book(s)? This action cannot be undone.`,
      );
      if (!confirmDelete) return;
    }

    setIsBulkProcessing(true);
    setActionMessage(null);
    try {
      await adminApiClient.post('/admin/books/bulk', {
        ids: selectedIds,
        action,
      });

      setActionMessage({
        text: `Successfully performed ${action} on ${selectedIds.length} book(s).`,
        type: 'success',
      });
      setSelectedIds([]);
      fetchBooks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to execute bulk ${action}`;
      setActionMessage({ text: msg, type: 'error' });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Single Item Actions
  const handlePublishToggle = async (book: BookListItem) => {
    try {
      if (book.status === 'published') {
        await adminApiClient.post(`/admin/books/${book.id || book._id}/unpublish`, {});
      } else {
        await adminApiClient.post(`/admin/books/${book.id || book._id}/publish`, {});
      }
      fetchBooks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      alert(msg);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await adminApiClient.delete(`/admin/books/${id}`);
      fetchBooks();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete book';
      alert(msg);
    }
  };

  // Table Columns
  const columns = useMemo<ColumnDef<BookListItem>[]>(() => {
    return [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            className="rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-orange-500/20"
            checked={books.length > 0 && selectedIds.length === books.length}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds(books.map((b) => b.id || b._id || ''));
              } else {
                setSelectedIds([]);
              }
            }}
          />
        ),
        cell: ({ row }) => {
          const id = row.original.id || row.original._id || '';
          const isSelected = selectedIds.includes(id);
          return (
            <input
              type="checkbox"
              className="rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-orange-500/20"
              checked={isSelected}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedIds((prev) => [...prev, id]);
                } else {
                  setSelectedIds((prev) => prev.filter((i) => i !== id));
                }
              }}
            />
          );
        },
      },
      {
        accessorKey: 'coverUrl',
        header: 'Cover',
        cell: ({ row }) => {
          const cover = row.original.coverUrl;
          return (
            <div className="relative w-12 h-16 rounded overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
              {cover ? (
                <img src={cover} alt="" className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-5 h-5 text-slate-500" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'title',
        header: 'Title & Author',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="max-w-md">
              <button
                onClick={() => router.push(`/books/${item.id || item._id}`)}
                className="font-medium text-white hover:text-orange-400 text-left transition-colors line-clamp-1"
              >
                {item.title}
              </button>
              <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                by {item.author || 'Unknown Author'}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'format',
        header: 'Format',
        cell: ({ row }) => {
          const fmt = row.original.format;
          return fmt === 'pdf' ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <File className="w-3 h-3" /> PDF
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FileText className="w-3 h-3" /> Summary
            </span>
          );
        },
      },
      {
        accessorKey: 'pricing',
        header: 'Pricing',
        cell: ({ row }) => {
          const item = row.original;
          return item.isFree ? (
            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Free
            </span>
          ) : (
            <span className="text-xs font-semibold text-white">₹{item.priceInr || 0}</span>
          );
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => {
          const cat = row.original.categoryId;
          return cat ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
              {cat.name}
            </span>
          ) : (
            <span className="text-xs text-slate-500">Uncategorized</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          let variant: BadgeVariant = 'draft';
          let label = 'Draft';

          if (status === 'published') {
            variant = 'published';
            label = 'Published';
          } else if (status === 'archived') {
            variant = 'archived';
            label = 'Archived';
          }

          return <Badge variant={variant}>{label}</Badge>;
        },
      },
      {
        accessorKey: 'publishedAt',
        header: 'Date',
        cell: ({ row }) => {
          const dateStr = row.original.publishedAt || row.original.createdAt;
          if (!dateStr) return <span className="text-xs text-slate-500">—</span>;
          const d = new Date(dateStr);
          return (
            <span className="text-xs text-slate-400">
              {d.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const item = row.original;
          const id = item.id || item._id || '';

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/books/${id}`)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                title="Edit Book"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePublishToggle(item)}
                className={`h-8 px-2 text-xs font-medium ${
                  item.status === 'published'
                    ? 'text-amber-400 hover:text-amber-300'
                    : 'text-emerald-400 hover:text-emerald-300'
                }`}
              >
                {item.status === 'published' ? 'Unpublish' : 'Publish'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(id)}
                className="h-8 w-8 p-0 text-slate-500 hover:text-rose-400"
                title="Delete Book"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        },
      },
    ];
  }, [books, selectedIds, router]);

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <BookOpen className="w-6 h-6 text-orange-500" />
              Books Library (CS10)
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage book summaries and downloadable PDFs for the mobile Learn library.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/books/new')}
              className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              New Book
            </Button>
          </div>
        </div>

        {/* Action Message Banner */}
        {actionMessage && (
          <div
            className={`p-4 rounded-lg flex items-center justify-between text-sm ${
              actionMessage.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
            }`}
          >
            <span>{actionMessage.text}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-slate-400 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative col-span-1 sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search books by title or author..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-orange-500/50"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Format Filter */}
            <div>
              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-orange-500/50"
              >
                <option value="">All Formats</option>
                <option value="pdf">PDF</option>
                <option value="summary">Summary</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-orange-500/50"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Pricing:</span>
              <button
                type="button"
                onClick={() => setPricingFilter('')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  pricingFilter === ''
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setPricingFilter('free')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  pricingFilter === 'free'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Free Only
              </button>
              <button
                type="button"
                onClick={() => setPricingFilter('paid')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  pricingFilter === 'paid'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Paid Only
              </button>
            </div>

            {/* Bulk Selection Actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in duration-200">
                <span className="text-xs text-slate-400 font-medium">
                  {selectedIds.length} selected
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={isBulkProcessing}
                  onClick={() => handleBulkAction('archive')}
                  className="h-7 text-xs flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5 text-slate-400" />
                  Archive
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isBulkProcessing}
                  onClick={() => handleBulkAction('delete')}
                  className="h-7 text-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm">
              <span className="font-semibold">Error:</span> {error}
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          <DataTable
            columns={columns}
            data={books}
            isLoading={isLoading}
            emptyTitle="No books found"
            emptyDescription="Click 'New Book' above to add your first book."
          />
        </div>
      </div>
    </AdminShell>
  );
}
