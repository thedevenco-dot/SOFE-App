'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Video,
  FileText,
  HelpCircle,
  Link as LinkIcon,
  Search,
  Trash2,
  Edit,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { AdminShell } from '../../components/layout/AdminShell';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { DataTable } from '../../components/ui/DataTable';
import { FormField } from '../../components/ui/FormField';
import { adminApiClient } from '../../lib/api-client';

export interface LessonListItem {
  id: string;
  _id?: string;
  title: string;
  courseId: string;
  courseTitle: string;
  moduleId: string;
  moduleTitle: string;
  type: 'video' | 'reading' | 'quiz' | 'resource';
  status: 'draft' | 'published';
  durationSec?: number;
  isFreePreview: boolean;
  isRequired: boolean;
  video?: {
    mux?: {
      status?: string;
      playbackId?: string;
    };
  };
  createdAt?: string;
}

interface CourseOption {
  _id: string;
  title: string;
  modules: Array<{ _id?: string; id?: string; title: string }>;
}

export default function LessonsListPage() {
  const router = useRouter();

  const [lessons, setLessons] = useState<LessonListItem[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createCourseId, setCreateCourseId] = useState('');
  const [createModuleId, setCreateModuleId] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createType, setCreateType] = useState<'video' | 'reading' | 'quiz' | 'resource'>('video');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Fetch Courses for Dropdown Filter
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await adminApiClient.get<{ data: CourseOption[] }>('/admin/courses?limit=100');
        const courseList = Array.isArray(res) ? res : res.data || [];
        setCourses(courseList);
      } catch {
        // non-blocking
      }
    };
    fetchCourses();
  }, []);

  // Fetch Lessons
  const fetchLessons = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search.trim()) params.append('search', search.trim());
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (courseFilter) params.append('courseId', courseFilter);

      const res = await adminApiClient.get<{
        data: LessonListItem[];
        meta: { total: number };
      }>(`/admin/lessons?${params.toString()}`);

      const data = Array.isArray(res) ? res : res.data || [];
      const metaTotal = res.meta?.total !== undefined ? res.meta.total : data.length;

      setLessons(data);
      setTotal(metaTotal);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lessons');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, typeFilter, statusFilter, courseFilter]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  // Handle Delete
  const handleDelete = async (id: string, lessonTitle: string) => {
    if (!confirm(`Are you sure you want to delete lesson "${lessonTitle}"?`)) return;

    try {
      await adminApiClient.delete(`/admin/lessons/${id}`);
      fetchLessons();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete lesson');
    }
  };

  // Handle Create
  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createCourseId) {
      setCreateError('Please select a course');
      return;
    }
    if (!createModuleId) {
      setCreateError('Please select a course module');
      return;
    }
    if (!createTitle.trim()) {
      setCreateError('Please enter a lesson title');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      const created = await adminApiClient.post<{ _id: string; id?: string }>('/admin/lessons', {
        courseId: createCourseId,
        moduleId: createModuleId,
        title: createTitle.trim(),
        type: createType,
        status: 'draft',
      });

      setIsCreateModalOpen(false);
      setCreateTitle('');
      const targetId = created.id || created._id;
      router.push(`/lessons/${targetId}`);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create lesson');
      setIsCreating(false);
    }
  };

  const selectedCourseForModal = courses.find((c) => c._id === createCourseId);
  const modulesForModal = selectedCourseForModal?.modules || [];

  const columns = React.useMemo<ColumnDef<LessonListItem>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Lesson Title',
        cell: ({ row }) => {
          const lesson = row.original;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  backgroundColor: '#0A233A',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {lesson.type === 'video' ? (
                  <Video size={16} color="var(--color-orange)" />
                ) : lesson.type === 'reading' ? (
                  <FileText size={16} color="var(--color-muted)" />
                ) : lesson.type === 'quiz' ? (
                  <HelpCircle size={16} color="var(--color-success)" />
                ) : (
                  <LinkIcon size={16} color="var(--color-muted)" />
                )}
              </div>
              <div>
                <span
                  onClick={() => router.push(`/lessons/${lesson.id || lesson._id}`)}
                  style={{
                    fontWeight: 600,
                    color: 'var(--color-white)',
                    cursor: 'pointer',
                    display: 'block',
                  }}
                >
                  {lesson.title}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                  {lesson.moduleTitle}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'courseTitle',
        header: 'Course',
        cell: ({ row }) => (
          <span style={{ fontSize: '13px', color: 'var(--color-white)' }}>
            {row.original.courseTitle}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const t = row.original.type;
          return (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: '#0A233A',
                color:
                  t === 'video'
                    ? 'var(--color-orange)'
                    : t === 'reading'
                      ? '#38bdf8'
                      : t === 'quiz'
                        ? 'var(--color-success)'
                        : 'var(--color-muted)',
              }}
            >
              {t}
            </span>
          );
        },
      },
      {
        accessorKey: 'durationSec',
        header: 'Duration',
        cell: ({ row }) => {
          const sec = row.original.durationSec || 0;
          const min = Math.round(sec / 60);
          return (
            <span
              style={{
                fontSize: '12px',
                color: 'var(--color-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Clock size={12} /> {min > 0 ? `${min} min` : `${sec}s`}
            </span>
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
        accessorKey: 'isFreePreview',
        header: 'Access',
        cell: ({ row }) => (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: row.original.isFreePreview
                ? 'rgba(61, 214, 140, 0.15)'
                : 'transparent',
              color: row.original.isFreePreview ? 'var(--color-success)' : 'var(--color-muted)',
            }}
          >
            {row.original.isFreePreview ? 'Free Preview' : 'Locked'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const lesson = row.original;
          const id = lesson.id || lesson._id || '';
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/lessons/${id}`)}
                title="Edit Lesson"
              >
                <Edit size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(id, lesson.title)}
                title="Delete Lesson"
              >
                <Trash2 size={14} color="var(--color-error)" />
              </Button>
            </div>
          );
        },
      },
    ],
    [router],
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
              Lessons & Video Library ({total})
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-muted)', marginTop: '4px' }}>
              Manage curriculum lessons, video streams, readings, and downloadable tools across
              courses
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="outline" onClick={() => router.push('/media/videos')}>
              <Video size={16} /> Video Processing
            </Button>
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus size={16} /> Create Lesson
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
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search
              size={16}
              color="var(--color-muted)"
              style={{ position: 'absolute', left: '12px', top: '12px' }}
            />
            <input
              type="text"
              placeholder="Search lessons by title..."
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

          {/* Course filter */}
          <select
            value={courseFilter}
            onChange={(e) => {
              setCourseFilter(e.target.value);
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
              minWidth: '180px',
            }}
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
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
            <option value="">All Types</option>
            <option value="video">Video</option>
            <option value="reading">Reading</option>
            <option value="quiz">Quiz</option>
            <option value="resource">Resource</option>
          </select>

          {/* Status filter */}
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
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Lessons DataTable */}
        <DataTable
          columns={columns}
          data={lessons}
          isLoading={isLoading}
          emptyTitle="No lessons found"
          emptyDescription="No lessons found matching your filters."
        />

        {/* Modal: Create Lesson */}
        {isCreateModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
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
                maxWidth: '480px',
                padding: '24px',
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--color-white)',
                  marginBottom: '16px',
                }}
              >
                Create New Lesson
              </h2>

              {createError && (
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: 'rgba(229, 72, 77, 0.1)',
                    borderRadius: '8px',
                    color: 'var(--color-error)',
                    fontSize: '13px',
                    marginBottom: '16px',
                  }}
                >
                  {createError}
                </div>
              )}

              <form
                onSubmit={handleCreateLesson}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <FormField label="Target Course" required htmlFor="create-course-select">
                  <select
                    id="create-course-select"
                    value={createCourseId}
                    onChange={(e) => {
                      setCreateCourseId(e.target.value);
                      const sel = courses.find((c) => c._id === e.target.value);
                      if (sel && sel.modules.length > 0) {
                        setCreateModuleId(sel.modules[0]._id || sel.modules[0].id || '');
                      } else {
                        setCreateModuleId('');
                      }
                    }}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#0A233A',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-white)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="">Select Course</option>
                    {courses.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Target Module / Section" required htmlFor="create-module-select">
                  <select
                    id="create-module-select"
                    value={createModuleId}
                    onChange={(e) => setCreateModuleId(e.target.value)}
                    disabled={!createCourseId || modulesForModal.length === 0}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#0A233A',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-white)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="">
                      {!createCourseId
                        ? 'Select course first'
                        : modulesForModal.length === 0
                          ? 'Course has no modules'
                          : 'Select Module'}
                    </option>
                    {modulesForModal.map((m) => {
                      const modId = m._id || m.id || '';
                      return (
                        <option key={modId} value={modId}>
                          {m.title}
                        </option>
                      );
                    })}
                  </select>
                </FormField>

                <FormField label="Lesson Title" required htmlFor="create-title-input">
                  <input
                    id="create-title-input"
                    type="text"
                    value={createTitle}
                    onChange={(e) => setCreateTitle(e.target.value)}
                    placeholder="e.g. Due Diligence Preparation & Data Rooms"
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#0A233A',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-white)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </FormField>

                <FormField label="Lesson Type" htmlFor="create-type-select">
                  <select
                    id="create-type-select"
                    value={createType}
                    onChange={(e) =>
                      setCreateType(e.target.value as 'video' | 'reading' | 'quiz' | 'resource')
                    }
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#0A233A',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-white)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="video">Video (Mux Stream)</option>
                    <option value="reading">Reading / Article</option>
                    <option value="quiz">Interactive Quiz</option>
                    <option value="resource">Resource & Files</option>
                  </select>
                </FormField>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    marginTop: '8px',
                  }}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setCreateError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Create & Open Editor'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
