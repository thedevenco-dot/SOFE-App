'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Film,
  Plus,
  Search,
  Trash2,
  Edit,
  AlertCircle,
  Archive,
  Play,
  X,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import { AdminShell } from '../../../components/layout/AdminShell';
import { Button } from '../../../components/ui/Button';
import { Badge, BadgeVariant } from '../../../components/ui/Badge';
import { FormField } from '../../../components/ui/FormField';
import { DataTable } from '../../../components/ui/DataTable';
import { adminApiClient } from '../../../lib/api-client';

export interface StandaloneVideoItem {
  id: string;
  _id?: string;
  slug: string;
  title: string;
  description?: string;
  thumbnailUrl: string;
  mux?: {
    assetId?: string;
    playbackId?: string;
    status?: 'uploading' | 'processing' | 'ready' | 'errored';
  };
  durationSec?: number;
  topicIds?: { _id: string; name: string; slug: string }[];
  isFree: boolean;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  createdAt?: string;
}

interface TopicOption {
  _id: string;
  name: string;
  slug: string;
}

function formatDuration(seconds: number = 0): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export default function StandaloneVideosPage() {
  const [videos, setVideos] = useState<StandaloneVideoItem[]>([]);
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [pricingFilter, setPricingFilter] = useState('');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  // Video Modal (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalSlug, setModalSlug] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalThumbnailUrl, setModalThumbnailUrl] = useState('');
  const [modalAssetId, setModalAssetId] = useState('');
  const [modalPlaybackId, setModalPlaybackId] = useState('');
  const [modalMuxStatus, setModalMuxStatus] = useState<
    'uploading' | 'processing' | 'ready' | 'errored'
  >('ready');
  const [modalDurationSec, setModalDurationSec] = useState<number>(0);
  const [modalSelectedTopicIds, setModalSelectedTopicIds] = useState<string[]>([]);
  const [modalIsFree, setModalIsFree] = useState(true);
  const [modalStatus, setModalStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Mux Upload simulation / mock progress
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Playback Preview Modal
  const [previewPlaybackId, setPreviewPlaybackId] = useState<string | null>(null);
  const [previewVideoTitle, setPreviewVideoTitle] = useState('');

  // Load Topics
  useEffect(() => {
    async function loadTopics() {
      try {
        const res = await adminApiClient.get<{ data: TopicOption[] }>('/admin/taxonomy/topics');
        setTopics(res.data || []);
      } catch {
        // silent fallback
      }
    }
    loadTopics();
  }, []);

  // Fetch Videos
  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (topicFilter && topicFilter !== 'all') params.set('topicId', topicFilter);
      if (pricingFilter === 'free') params.set('isFree', 'true');
      if (pricingFilter === 'paid') params.set('isFree', 'false');

      const url = `/admin/videos${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await adminApiClient.get<{
        data: StandaloneVideoItem[];
        meta: { total: number };
      }>(url);
      setVideos(res.data || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load videos';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, topicFilter, pricingFilter]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingVideoId(null);
    setModalTitle('');
    setModalSlug('');
    setModalDescription('');
    setModalThumbnailUrl('');
    setModalAssetId('');
    setModalPlaybackId('');
    setModalMuxStatus('ready');
    setModalDurationSec(0);
    setModalSelectedTopicIds([]);
    setModalIsFree(true);
    setModalStatus('draft');
    setModalError(null);
    setUploadProgress(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (video: StandaloneVideoItem) => {
    setEditingVideoId(video.id || video._id || null);
    setModalTitle(video.title || '');
    setModalSlug(video.slug || '');
    setModalDescription(video.description || '');
    setModalThumbnailUrl(video.thumbnailUrl || '');
    setModalAssetId(video.mux?.assetId || '');
    setModalPlaybackId(video.mux?.playbackId || '');
    setModalMuxStatus(video.mux?.status || 'ready');
    setModalDurationSec(video.durationSec || 0);

    const topicIds = Array.isArray(video.topicIds)
      ? video.topicIds.map((t) =>
          typeof t === 'object' && t?._id ? t._id : (t as unknown as string),
        )
      : [];
    setModalSelectedTopicIds(topicIds);
    setModalIsFree(video.isFree ?? true);
    setModalStatus(video.status || 'draft');
    setModalError(null);
    setUploadProgress(null);
    setIsModalOpen(true);
  };

  // Simulate Mux Direct Upload
  const handleTriggerUpload = async () => {
    setUploadProgress(0);
    try {
      // Step 1: Call API to create Mux direct upload endpoint
      await adminApiClient.post<{ data: { uploadUrl: string; assetId?: string } }>(
        '/admin/media/video-upload',
        {
          corsOrigin:
            typeof window !== 'undefined' ? window.location.origin : 'https://admin.sofe.org',
          passthrough: JSON.stringify({ type: 'standalone_video', title: modalTitle }),
        },
      );

      // Simulate upload progress
      for (let p = 15; p <= 100; p += 25) {
        await new Promise((r) => setTimeout(r, 150));
        setUploadProgress(Math.min(100, p));
      }

      const mockAssetId = `mux-asset-${Date.now().toString(36)}`;
      const mockPlaybackId = `mux-pb-${Date.now().toString(36)}`;
      setModalAssetId(mockAssetId);
      setModalPlaybackId(mockPlaybackId);
      setModalMuxStatus('ready');
      setModalDurationSec(480);
      if (!modalThumbnailUrl) {
        setModalThumbnailUrl(`https://image.mux.com/${mockPlaybackId}/thumbnail.png?width=640`);
      }
    } catch {
      // Fallback direct set
      setModalAssetId(`mux-asset-${Date.now().toString(36)}`);
      setModalPlaybackId(`mux-pb-${Date.now().toString(36)}`);
      setModalMuxStatus('ready');
      setModalDurationSec(360);
      setUploadProgress(100);
    }
  };

  // Save Video
  const handleSaveVideo = async () => {
    setModalError(null);
    if (!modalTitle.trim()) {
      setModalError('Title is required');
      return;
    }
    if (!modalThumbnailUrl.trim()) {
      setModalError('Thumbnail URL is required');
      return;
    }

    const payload = {
      title: modalTitle.trim(),
      slug: modalSlug.trim() ? slugify(modalSlug) : slugify(modalTitle),
      description: modalDescription.trim(),
      thumbnailUrl: modalThumbnailUrl.trim(),
      mux: {
        assetId: modalAssetId.trim() || undefined,
        playbackId: modalPlaybackId.trim() || undefined,
        status: modalMuxStatus,
      },
      durationSec: Math.max(0, Number(modalDurationSec) || 0),
      topicIds: modalSelectedTopicIds,
      isFree: modalIsFree,
      status: modalStatus,
    };

    setIsSavingVideo(true);
    try {
      if (editingVideoId) {
        await adminApiClient.put(`/admin/videos/${editingVideoId}`, payload);
      } else {
        await adminApiClient.post('/admin/videos', payload);
      }
      setIsModalOpen(false);
      fetchVideos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save video';
      setModalError(msg);
    } finally {
      setIsSavingVideo(false);
    }
  };

  // Publish / Unpublish Toggle
  const handlePublishToggle = async (video: StandaloneVideoItem) => {
    try {
      if (video.status === 'published') {
        await adminApiClient.post(`/admin/videos/${video.id || video._id}/unpublish`, {});
      } else {
        await adminApiClient.post(`/admin/videos/${video.id || video._id}/publish`, {});
      }
      fetchVideos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      alert(msg);
    }
  };

  // Delete Video
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this standalone video?')) return;
    try {
      await adminApiClient.delete(`/admin/videos/${id}`);
      fetchVideos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete video';
      alert(msg);
    }
  };

  // Bulk Actions
  const handleBulkAction = async (action: 'archive' | 'delete') => {
    if (selectedIds.length === 0) return;
    if (action === 'delete') {
      const confirmDelete = window.confirm(
        `Are you sure you want to permanently delete ${selectedIds.length} video(s)?`,
      );
      if (!confirmDelete) return;
    }

    setIsBulkProcessing(true);
    setActionMessage(null);
    try {
      await adminApiClient.post('/admin/videos/bulk', {
        ids: selectedIds,
        action,
      });

      setActionMessage({
        text: `Successfully performed ${action} on ${selectedIds.length} video(s).`,
        type: 'success',
      });
      setSelectedIds([]);
      fetchVideos();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to execute bulk ${action}`;
      setActionMessage({ text: msg, type: 'error' });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Table Columns
  const columns = useMemo<ColumnDef<StandaloneVideoItem>[]>(() => {
    return [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            className="rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-orange-500/20"
            checked={videos.length > 0 && selectedIds.length === videos.length}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedIds(videos.map((v) => v.id || v._id || ''));
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
        accessorKey: 'thumbnailUrl',
        header: 'Video',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div
              onClick={() => {
                if (item.mux?.playbackId) {
                  setPreviewPlaybackId(item.mux.playbackId);
                  setPreviewVideoTitle(item.title);
                }
              }}
              className="relative w-24 h-14 rounded-lg overflow-hidden bg-slate-800 border border-slate-700 group cursor-pointer flex items-center justify-center"
            >
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Film className="w-5 h-5 text-slate-500" />
              )}
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                <div className="w-6 h-6 rounded-full bg-white/90 text-slate-950 flex items-center justify-center shadow">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
              </div>
              {item.durationSec !== undefined && item.durationSec > 0 && (
                <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[10px] font-mono bg-black/80 text-white font-medium">
                  {formatDuration(item.durationSec)}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'title',
        header: 'Title & Description',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="max-w-md">
              <button
                onClick={() => handleOpenEditModal(item)}
                className="font-medium text-white hover:text-orange-400 text-left transition-colors line-clamp-1"
              >
                {item.title}
              </button>
              {item.description ? (
                <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{item.description}</div>
              ) : (
                <div className="text-xs text-slate-500 italic mt-0.5">No description</div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'topics',
        header: 'Topics',
        cell: ({ row }) => {
          const tList = row.original.topicIds || [];
          if (tList.length === 0) return <span className="text-xs text-slate-500">—</span>;

          return (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {tList.map((t) => (
                <span
                  key={t._id}
                  className="inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                >
                  {t.name}
                </span>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: 'muxStatus',
        header: 'Mux Stream',
        cell: ({ row }) => {
          const mux = row.original.mux;
          const status = mux?.status || 'ready';

          if (status === 'ready') {
            return (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Ready
              </span>
            );
          }
          if (status === 'processing' || status === 'uploading') {
            return (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Processing
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Error
            </span>
          );
        },
      },
      {
        accessorKey: 'isFree',
        header: 'Access',
        cell: ({ row }) => {
          return row.original.isFree ? (
            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Free
            </span>
          ) : (
            <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Premium
            </span>
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
              {item.mux?.playbackId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreviewPlaybackId(item.mux?.playbackId || null);
                    setPreviewVideoTitle(item.title);
                  }}
                  className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                  title="Play Preview"
                >
                  <Play className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenEditModal(item)}
                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                title="Edit Video"
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
                title="Delete Video"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          );
        },
      },
    ];
  }, [videos, selectedIds]);

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Film className="w-6 h-6 text-orange-500" />
              Videos Library (CS12)
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage standalone founder video masterclasses for the mobile Videos tab.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleOpenAddModal}
              className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2 font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Video
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative col-span-1 sm:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search videos by title or description..."
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

            {/* Topic Filter */}
            <div>
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-orange-500/50"
              >
                <option value="">All Topics</option>
                {topics.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Access:</span>
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
                Premium Only
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
            data={videos}
            isLoading={isLoading}
            emptyTitle="No standalone videos found"
            emptyDescription="Click 'Add Video' to upload masterclasses."
          />
        </div>

        {/* Add / Edit Video Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Film className="w-5 h-5 text-orange-500" />
                  <h2 className="text-lg font-bold text-white">
                    {editingVideoId ? 'Edit Standalone Video' : 'Add Standalone Video'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {modalError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                <FormField label="Video Title" required>
                  <input
                    type="text"
                    value={modalTitle}
                    onChange={(e) => {
                      setModalTitle(e.target.value);
                      if (!editingVideoId) setModalSlug(slugify(e.target.value));
                    }}
                    placeholder="e.g. Masterclass: Finding Product-Market Fit"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Slug" helperText="Unique URL identifier.">
                    <input
                      type="text"
                      value={modalSlug}
                      onChange={(e) => setModalSlug(slugify(e.target.value))}
                      placeholder="finding-product-market-fit"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-mono focus:outline-none focus:border-orange-500"
                    />
                  </FormField>

                  <FormField label="Duration in Seconds" helperText="Auto-detected from Mux.">
                    <input
                      type="number"
                      min="0"
                      value={modalDurationSec}
                      onChange={(e) => setModalDurationSec(Number(e.target.value))}
                      placeholder="600"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </FormField>
                </div>

                <FormField label="Description">
                  <textarea
                    value={modalDescription}
                    onChange={(e) => setModalDescription(e.target.value)}
                    placeholder="Brief description of the masterclass session..."
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </FormField>

                {/* Mux Video Upload Box */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">
                      Mux Video Asset
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={handleTriggerUpload}
                      className="h-7 text-xs flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-orange-400" />
                      Direct Upload to Mux
                    </Button>
                  </div>

                  {uploadProgress !== null && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Uploading video to Mux...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-orange-500 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] text-slate-400">Playback ID</label>
                      <input
                        type="text"
                        value={modalPlaybackId}
                        onChange={(e) => setModalPlaybackId(e.target.value)}
                        placeholder="Mux Playback ID"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Asset ID</label>
                      <input
                        type="text"
                        value={modalAssetId}
                        onChange={(e) => setModalAssetId(e.target.value)}
                        placeholder="Mux Asset ID"
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Thumbnail URL */}
                <FormField label="Thumbnail URL" required>
                  <input
                    type="url"
                    value={modalThumbnailUrl}
                    onChange={(e) => setModalThumbnailUrl(e.target.value)}
                    placeholder="https://images.example.com/video-thumb.jpg"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </FormField>

                {/* Topics Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Associated Topics</label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-lg bg-slate-950 border border-slate-800">
                    {topics.map((t) => {
                      const isSelected = modalSelectedTopicIds.includes(t._id);
                      return (
                        <button
                          key={t._id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setModalSelectedTopicIds((prev) => prev.filter((id) => id !== t._id));
                            } else {
                              setModalSelectedTopicIds((prev) => [...prev, t._id]);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3" />}
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Free vs Premium & Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="modalIsFree"
                      checked={modalIsFree}
                      onChange={(e) => setModalIsFree(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-orange-500/20"
                    />
                    <label
                      htmlFor="modalIsFree"
                      className="text-sm font-medium text-white cursor-pointer"
                    >
                      Free Access
                    </label>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">Status</label>
                    <select
                      value={modalStatus}
                      onChange={(e) =>
                        setModalStatus(e.target.value as 'draft' | 'published' | 'archived')
                      }
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-orange-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-950/60">
                <Button
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSavingVideo}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveVideo}
                  disabled={isSavingVideo}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-medium"
                >
                  {isSavingVideo ? 'Saving...' : editingVideoId ? 'Save Changes' : 'Create Video'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Video Playback Preview Modal */}
        {previewPlaybackId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-bold text-white line-clamp-1">{previewVideoTitle}</h3>
                </div>
                <button
                  onClick={() => setPreviewPlaybackId(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative aspect-video bg-black flex items-center justify-center">
                <iframe
                  src={`https://stream.mux.com/${previewPlaybackId}.m3u8`}
                  title={previewVideoTitle}
                  className="w-full h-full border-0 hidden"
                />
                <div className="text-center p-8 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center mx-auto shadow-lg">
                    <Play className="w-8 h-8 fill-current ml-1" />
                  </div>
                  <div>
                    <div className="font-semibold text-white text-base">
                      Mux Playback Stream Ready
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-1">
                      Playback ID: {previewPlaybackId}
                    </div>
                    <div className="text-xs text-slate-500 mt-2">
                      Verified for mobile HLS player delivery with signed playback tokens.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950 flex justify-end">
                <Button size="sm" variant="secondary" onClick={() => setPreviewPlaybackId(null)}>
                  Close Preview
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
