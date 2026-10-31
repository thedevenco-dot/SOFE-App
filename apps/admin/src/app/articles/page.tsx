'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ColumnDef } from '@tanstack/react-table';
import {
  FileText,
  Plus,
  Search,
  Star,
  Eye,
  Trash2,
  Edit,
  Clock,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { adminApiClient } from '../../lib/api-client';

export interface ArticleListItem {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  excerpt: string;
  coverUrl: string;
  primaryTopicId?: { _id: string; name: string; slug: string };
  authorId?: { _id: string; name: string; avatarUrl?: string; title?: string };
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  featured: boolean;
  readTimeMin: number;
  publishedAt?: string;
  scheduledAt?: string;
  stats?: { views: number; bookmarks: number };
  createdAt?: string;
}

interface TopicOption {
  _id: string;
  name: string;
  slug: string;
}

interface AuthorOption {
  _id: string;
  name: string;
  title?: string;
}

export default function ArticlesListPage() {
  const router = useRouter();

  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkActing, setIsBulkActing] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Fetch Topics and Authors for Filters
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const [topRes, autRes] = await Promise.all([
          adminApiClient.get<{ data: TopicOption[] }>('/admin/taxonomy/topics?limit=100'),
          adminApiClient.get<{ data: AuthorOption[] }>('/admin/taxonomy/authors?limit=100'),
        ]);
        setTopics(Array.isArray(topRes) ? topRes : topRes.data || []);
        setAuthors(Array.isArray(autRes) ? autRes : autRes.data || []);
      } catch {
        // non-blocking
      }
    };
    fetchDropdowns();
  }, []);

  // Fetch Articles
  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) params.append('search', search.trim());
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (topicFilter) params.append('topicId', topicFilter);
      if (authorFilter) params.append('authorId', authorFilter);
      if (featuredFilter) params.append('featured', featuredFilter);

      const res = await adminApiClient.get<{
        data: ArticleListItem[];
        meta: { total: number };
      }>(`/admin/articles?${params.toString()}`);

      const data = Array.isArray(res) ? res : res.data || [];
      const metaTotal = res.meta?.total !== undefined ? res.meta.total : data.length;

      setArticles(data);
      setTotal(metaTotal);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch articles');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, statusFilter, topicFilter, authorFilter, featuredFilter]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Bulk Action Handler
  const handleBulkAction = async (action: 'archive' | 'feature' | 'unfeature') => {
    if (selectedIds.length === 0) return;
    setIsBulkActing(true);
    try {
      await adminApiClient.post('/admin/articles/bulk', {
        ids: selectedIds,
        action,
      });
      setSelectedIds([]);
      fetchArticles();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Bulk action failed');
    } finally {
      setIsBulkActing(false);
    }
  };

  // Toggle Featured
  const handleToggleFeatured = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await adminApiClient.post(`/admin/articles/${id}/feature`);
      fetchArticles();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to toggle featured');
    }
  };

  // Delete Article
  const handleDelete = async (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete article "${title}"?`)) return;

    try {
      await adminApiClient.delete(`/admin/articles/${id}`);
      fetchArticles();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete article');
    }
  };

  // Select all toggle
  const allIdsOnPage = useMemo(() => articles.map((a) => a.id || a._id || ''), [articles]);
  const isAllSelected =
    allIdsOnPage.length > 0 && allIdsOnPage.every((id) => selectedIds.includes(id));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allIdsOnPage.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...allIdsOnPage])]);
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // TanStack Columns
  const columns = useMemo<ColumnDef<ArticleListItem>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={handleToggleSelectAll}
            aria-label="Select all"
            style={{ width: '16px', height: '16px', accentColor: 'var(--color-orange)' }}
          />
        ),
        cell: ({ row }) => {
          const id = row.original.id || row.original._id || '';
          const isSelected = selectedIds.includes(id);
          return (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleToggleSelectRow(id)}
              aria-label={`Select ${row.original.title}`}
              style={{ width: '16px', height: '16px', accentColor: 'var(--color-orange)' }}
            />
          );
        },
      },
      {
        accessorKey: 'title',
        header: 'Article',
        cell: ({ row }) => {
          const article = row.original;
          const id = article.id || article._id || '';
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '260px' }}>
              <div
                style={{
                  width: '52px',
                  height: '36px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  backgroundColor: '#0A233A',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {article.coverUrl ? (
                  <img
                    src={article.coverUrl}
                    alt={article.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <FileText size={18} color="var(--color-muted)" />
                )}
              </div>
              <div>
                <span
                  onClick={() => router.push(`/articles/${id}`)}
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-white)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'block',
                    lineHeight: '1.3',
                  }}
                >
                  {article.title}
                </span>
                <span
                  style={{ fontSize: '11px', color: 'var(--color-muted)', fontFamily: 'monospace' }}
                >
                  /{article.slug}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'primaryTopicId',
        header: 'Primary Topic',
        cell: ({ row }) => {
          const topic = row.original.primaryTopicId;
          return (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: '#0A233A',
                color: 'var(--color-orange)',
              }}
            >
              {topic?.name || 'Unassigned'}
            </span>
          );
        },
      },
      {
        accessorKey: 'authorId',
        header: 'Author',
        cell: ({ row }) => {
          const author = row.original.authorId;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {author?.avatarUrl ? (
                <img
                  src={author.avatarUrl}
                  alt={author.name}
                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#1E3A5F',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    color: 'var(--color-white)',
                  }}
                >
                  {author?.name?.charAt(0) || 'A'}
                </div>
              )}
              <span style={{ fontSize: '13px', color: 'var(--color-white)' }}>
                {author?.name || 'Unknown'}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge variant={row.original.status as BadgeVariant}>
            {row.original.status.toUpperCase()}
          </Badge>
        ),
      },
      {
        accessorKey: 'featured',
        header: 'Featured',
        cell: ({ row }) => {
          const isFeatured = row.original.featured;
          const id = row.original.id || row.original._id || '';
          return (
            <button
              type="button"
              onClick={(e) => handleToggleFeatured(id, e)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: isFeatured ? 'var(--color-orange)' : 'var(--color-muted)',
                padding: '4px',
              }}
              title={
                isFeatured ? 'Featured (click to unfeature)' : 'Not featured (click to feature)'
              }
            >
              <Star size={16} fill={isFeatured ? 'var(--color-orange)' : 'none'} />
              {isFeatured && <span style={{ fontSize: '11px', fontWeight: 600 }}>Hero</span>}
            </button>
          );
        },
      },
      {
        accessorKey: 'readTimeMin',
        header: 'Read Time',
        cell: ({ row }) => (
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Clock size={12} /> {row.original.readTimeMin || 5} min
          </span>
        ),
      },
      {
        accessorKey: 'views',
        header: 'Views',
        cell: ({ row }) => (
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Eye size={12} /> {row.original.stats?.views || 0}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const article = row.original;
          const id = article.id || article._id || '';
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/articles/${id}`)}
                title="Edit Article"
              >
                <Edit size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDelete(id, article.title, e)}
                title="Delete Article"
              >
                <Trash2 size={14} color="var(--color-error)" />
              </Button>
            </div>
          );
        },
      },
    ],
    [router, selectedIds, isAllSelected],
  );

  return (
    <AdminShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--color-white)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              Startup World Articles ({total})
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginTop: '4px' }}>
              Curate founder stories, market breakdowns, venture playbooks, and educational reads
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="primary" onClick={() => router.push('/articles/new')}>
              <Plus size={16} /> Create Article
            </Button>
          </div>
        </div>

        {/* Bulk Actions Banner */}
        {selectedIds.length > 0 && (
          <div
            style={{
              padding: '12px 18px',
              backgroundColor: '#0F273D',
              border: '1px solid var(--color-orange)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-white)' }}>
              {selectedIds.length} article(s) selected
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                disabled={isBulkActing}
                onClick={() => handleBulkAction('feature')}
              >
                <Star size={14} /> Bulk Feature
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isBulkActing}
                onClick={() => handleBulkAction('unfeature')}
              >
                Unfeature
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isBulkActing}
                onClick={() => handleBulkAction('archive')}
              >
                <Archive size={14} /> Bulk Archive
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: 'var(--color-slate)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
            alignItems: 'center',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search
              size={16}
              color="var(--color-muted)"
              style={{ position: 'absolute', left: '12px', top: '12px' }}
            />
            <input
              type="text"
              placeholder="Search articles by title or slug..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                backgroundColor: '#0A233A',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                color: 'var(--color-white)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {/* Status Tabs */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '9px 12px',
              backgroundColor: '#0A233A',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-white)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="archived">Archived</option>
          </select>

          {/* Topic filter */}
          <select
            value={topicFilter}
            onChange={(e) => {
              setTopicFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '9px 12px',
              backgroundColor: '#0A233A',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-white)',
              fontSize: '13px',
              outline: 'none',
              minWidth: '160px',
            }}
          >
            <option value="">All Topics</option>
            {topics.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Author filter */}
          <select
            value={authorFilter}
            onChange={(e) => {
              setAuthorFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '9px 12px',
              backgroundColor: '#0A233A',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-white)',
              fontSize: '13px',
              outline: 'none',
              minWidth: '160px',
            }}
          >
            <option value="">All Authors</option>
            {authors.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Featured toggle */}
          <select
            value={featuredFilter}
            onChange={(e) => {
              setFeaturedFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '9px 12px',
              backgroundColor: '#0A233A',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              color: 'var(--color-white)',
              fontSize: '13px',
              outline: 'none',
            }}
          >
            <option value="">All Curation</option>
            <option value="true">Featured Only</option>
            <option value="false">Standard Feed</option>
          </select>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(229, 72, 77, 0.1)',
              border: '1px solid var(--color-error)',
              borderRadius: '8px',
              color: 'var(--color-error)',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* DataTable */}
        <DataTable
          columns={columns}
          data={articles}
          isLoading={isLoading}
          emptyTitle="No articles found"
          emptyDescription="No Startup World articles found matching your criteria. Click 'Create Article' to write one."
        />
      </div>
    </AdminShell>
  );
}
