'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Video,
  Play,
  RefreshCw,
  Search,
  ExternalLink,
  Copy,
  Check,
  Eye,
  X,
  AlertCircle,
} from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { AdminShell } from '../../../components/layout/AdminShell';
import { Button } from '../../../components/ui/Button';
import { DataTable } from '../../../components/ui/DataTable';
import { adminApiClient } from '../../../lib/api-client';

export interface VideoAssetRow {
  id: string;
  sourceType: 'lesson' | 'standalone';
  title: string;
  courseId?: string;
  courseTitle?: string;
  moduleId?: string;
  moduleTitle?: string;
  assetId?: string;
  playbackId?: string;
  status: 'ready' | 'processing' | 'uploading' | 'errored' | string;
  durationSec: number;
  isFreePreview?: boolean;
  updatedAt: string;
  error?: string;
}

export default function VideoStatusPage() {
  const router = useRouter();

  const [assets, setAssets] = useState<VideoAssetRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Video Preview Modal
  const [previewItem, setPreviewItem] = useState<VideoAssetRow | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) params.append('search', search.trim());
      if (statusFilter) params.append('status', statusFilter);

      const res = await adminApiClient.get<{
        data: VideoAssetRow[];
        meta: { total: number };
      }>(`/admin/media/video-assets?${params.toString()}`);

      const data = Array.isArray(res) ? res : res.data || [];
      const metaTotal = res.meta?.total !== undefined ? res.meta.total : data.length;

      setAssets(data);
      setTotal(metaTotal);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch video assets');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const columns = React.useMemo<ColumnDef<VideoAssetRow>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Lesson / Asset Title',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: '#0A233A',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Video size={16} color="var(--color-orange)" />
              </div>
              <div>
                <span
                  onClick={() => router.push(`/lessons/${item.id}`)}
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-white)',
                    cursor: 'pointer',
                    display: 'block',
                  }}
                >
                  {item.title}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                  {item.courseTitle} {item.moduleTitle ? `• ${item.moduleTitle}` : ''}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'playbackId',
        header: 'Mux Identifiers',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {item.playbackId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <code
                    style={{
                      fontSize: '11px',
                      backgroundColor: '#061E30',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      color: 'var(--color-white)',
                    }}
                  >
                    {item.playbackId}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(item.playbackId!, `pb-${item.id}`)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color:
                        copiedId === `pb-${item.id}`
                          ? 'var(--color-success)'
                          : 'var(--color-muted)',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                    }}
                    title="Copy Playback ID"
                  >
                    {copiedId === `pb-${item.id}` ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                  No Playback ID
                </span>
              )}

              {item.assetId && (
                <span style={{ fontSize: '10px', color: 'var(--color-muted)' }}>
                  Asset: {item.assetId}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const item = row.original;
          const isReady = item.status === 'ready';
          const isProcessing = item.status === 'processing';
          const isUploading = item.status === 'uploading';

          return (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                backgroundColor: isReady
                  ? 'rgba(61, 214, 140, 0.15)'
                  : isProcessing
                    ? 'rgba(255, 132, 41, 0.15)'
                    : isUploading
                      ? 'rgba(56, 189, 248, 0.15)'
                      : 'rgba(229, 72, 77, 0.15)',
                color: isReady
                  ? 'var(--color-success)'
                  : isProcessing
                    ? 'var(--color-orange)'
                    : isUploading
                      ? '#38bdf8'
                      : 'var(--color-error)',
              }}
            >
              {item.status}
            </span>
          );
        },
      },
      {
        accessorKey: 'durationSec',
        header: 'Duration',
        cell: ({ row }) => {
          const item = row.original;
          const min = Math.round((item.durationSec || 0) / 60);
          return (
            <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
              {min > 0 ? `${min} min` : `${item.durationSec || 0}s`}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {item.playbackId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewItem(item)}
                  title="Preview Video"
                >
                  <Eye size={14} /> Preview
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/lessons/${item.id}`)}
                title="Edit Lesson"
              >
                <ExternalLink size={14} />
              </Button>
            </div>
          );
        },
      },
    ],
    [router, copiedId],
  );

  return (
    <AdminShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
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
              Video Processing & Mux Assets ({total})
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginTop: '4px' }}>
              Real-time monitoring of Mux encoding jobs, playback health, and video uploads across
              curriculum
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="outline" onClick={fetchAssets}>
              <RefreshCw size={16} /> Refresh Status
            </Button>
            <Button variant="primary" onClick={() => router.push('/lessons')}>
              Manage Lessons
            </Button>
          </div>
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

        {/* Filters */}
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
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search
              size={16}
              color="var(--color-muted)"
              style={{ position: 'absolute', left: '12px', top: '12px' }}
            />
            <input
              type="text"
              placeholder="Search video assets..."
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
            <option value="ready">Ready</option>
            <option value="processing">Processing</option>
            <option value="uploading">Uploading</option>
            <option value="errored">Errored</option>
          </select>
        </div>

        {/* Assets DataTable */}
        <DataTable
          columns={columns}
          data={assets}
          isLoading={isLoading}
          emptyTitle="No video assets found"
          emptyDescription="No video assets found matching your criteria."
        />

        {/* Video Preview Modal */}
        {previewItem && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '16px',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--color-slate)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '640px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-white)' }}>
                    {previewItem.title}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                    {previewItem.courseTitle}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Player / Poster Area */}
              <div
                style={{
                  backgroundColor: '#000',
                  aspectRatio: '16/9',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={`https://image.mux.com/${previewItem.playbackId}/thumbnail.png?width=960`}
                  alt="Video thumbnail"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255, 132, 41, 0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-white)',
                    }}
                  >
                    <Play size={24} style={{ marginLeft: '4px' }} />
                  </div>
                </div>
              </div>

              {/* Modal Footer Info */}
              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--color-muted)' }}>Playback ID: </span>
                  <code style={{ color: 'var(--color-white)', fontFamily: 'monospace' }}>
                    {previewItem.playbackId}
                  </code>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setPreviewItem(null);
                    router.push(`/lessons/${previewItem.id}`);
                  }}
                >
                  Open in Lesson Editor
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
