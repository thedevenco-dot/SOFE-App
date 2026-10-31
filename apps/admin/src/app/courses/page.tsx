'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit2,
  Copy,
  Archive,
  GraduationCap,
  Star,
  Users,
  AlertCircle,
  X,
} from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import { DataTable } from '../../components/ui/DataTable';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { FormField } from '../../components/ui/FormField';
import { adminApiClient } from '../../lib/api-client';

export interface CourseListItem {
  _id: string;
  title: string;
  slug: string;
  thumbnailUrl: string;
  priceInr: number;
  status: 'draft' | 'review' | 'published' | 'archived';
  version: number;
  categoryId?: { _id: string; name: string; slug: string };
  instructorIds?: Array<{ _id: string; name: string }>;
  stats?: {
    enrolledCount: number;
    ratingAvg: number;
    ratingCount: number;
    lessonCount: number;
    durationSec: number;
  };
  updatedAt?: string;
}

export interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
}

const STATUS_TABS = ['all', 'published', 'draft', 'review', 'archived'] as const;

export default function CoursesListPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceType, setPriceType] = useState<'all' | 'free' | 'paid'>('all');
  const [search, setSearch] = useState<string>('');

  // Quick Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    slug: '',
    categoryId: '',
    priceInr: 0,
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Duplicate / Archive action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (selectedCategory !== 'all') params.set('categoryId', selectedCategory);
      if (priceType !== 'all') params.set('priceType', priceType);
      if (search.trim()) params.set('search', search.trim());
      params.set('limit', '50');

      const data = await adminApiClient.get<{ items: CourseListItem[]; total: number }>(
        `/admin/courses?${params.toString()}`,
      );
      setCourses(data?.items || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch courses';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, selectedCategory, priceType, search]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await adminApiClient.get<CategoryOption[]>('/admin/course-categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const generatedSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    setCreateForm((prev) => ({ ...prev, title, slug: generatedSlug }));
  };

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!createForm.title.trim()) errors.title = 'Course title is required';
    if (!createForm.categoryId) errors.categoryId = 'Category is required';

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setCreateErrors({});
    try {
      const newCourse = await adminApiClient.post<CourseListItem>('/admin/courses', {
        title: createForm.title.trim(),
        slug: createForm.slug.trim(),
        categoryId: createForm.categoryId,
        priceInr: Number(createForm.priceInr) * 100, // convert rupees to paise
      });
      setIsCreateModalOpen(false);
      router.push(`/courses/${newCourse._id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create course';
      setCreateErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDuplicate = async (courseId: string) => {
    setActionLoadingId(courseId);
    try {
      const duplicated = await adminApiClient.post<CourseListItem>(
        `/admin/courses/${courseId}/duplicate`,
      );
      await fetchCourses();
      router.push(`/courses/${duplicated._id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to duplicate course');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleArchive = async (course: CourseListItem) => {
    if (!confirm(`Are you sure you want to archive course "${course.title}"?`)) return;
    setActionLoadingId(course._id);
    try {
      await adminApiClient.delete(`/admin/courses/${course._id}`);
      await fetchCourses();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to archive course');
    } finally {
      setActionLoadingId(null);
    }
  };

  const columns = useMemo<ColumnDef<CourseListItem>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Course Details',
        cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', maxWidth: '320px' }}>
            <div
              style={{
                width: '56px',
                height: '36px',
                borderRadius: '6px',
                backgroundColor: '#1E3A5F',
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {row.original.thumbnailUrl ? (
                <img
                  src={row.original.thumbnailUrl}
                  alt={row.original.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <GraduationCap size={18} color="var(--color-orange)" />
              )}
            </div>
            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: 'var(--color-white)',
                  fontSize: '14px',
                  lineHeight: '1.3',
                }}
              >
                {row.original.title}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--color-muted)',
                    fontFamily: 'monospace',
                  }}
                >
                  /{row.original.slug}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    backgroundColor: '#0F273D',
                    borderRadius: '4px',
                    color: 'var(--color-orange)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  v{row.original.version || 1}
                </span>
              </div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'categoryId',
        header: 'Category',
        cell: ({ row }) => (
          <span style={{ fontSize: '13px', color: 'var(--color-white)' }}>
            {row.original.categoryId?.name || 'Uncategorized'}
          </span>
        ),
      },
      {
        accessorKey: 'priceInr',
        header: 'Price',
        cell: ({ row }) => {
          const pricePaise = row.original.priceInr || 0;
          if (pricePaise === 0) {
            return (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--color-success)',
                  backgroundColor: 'rgba(61, 214, 140, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                Free
              </span>
            );
          }
          return (
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-white)' }}>
              ₹{(pricePaise / 100).toLocaleString('en-IN')}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          const variantMap: Record<string, BadgeVariant> = {
            published: 'published',
            draft: 'draft',
            review: 'review',
            archived: 'archived',
          };
          return <Badge variant={variantMap[status] || 'draft'}>{status.toUpperCase()}</Badge>;
        },
      },
      {
        accessorKey: 'stats.enrolledCount',
        header: 'Enrolled',
        cell: ({ row }) => (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '13px',
              color: 'var(--color-muted)',
            }}
          >
            <Users size={14} />
            <span>{row.original.stats?.enrolledCount || 0}</span>
          </div>
        ),
      },
      {
        accessorKey: 'stats.ratingAvg',
        header: 'Rating',
        cell: ({ row }) => {
          const rating = row.original.stats?.ratingAvg || 0;
          const count = row.original.stats?.ratingCount || 0;
          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '13px',
                color: 'var(--color-muted)',
              }}
            >
              <Star size={14} fill="#FF8429" stroke="#FF8429" />
              <span style={{ fontWeight: 600, color: 'var(--color-white)' }}>
                {rating > 0 ? rating.toFixed(1) : '—'}
              </span>
              {count > 0 && <span>({count})</span>}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const isBusy = actionLoadingId === row.original._id;
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => router.push(`/courses/${row.original._id}`)}
                title="Edit Course"
                aria-label={`Edit ${row.original.title}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-muted)',
                  padding: '6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Edit2 size={16} />
              </button>
              <button
                disabled={isBusy}
                onClick={() => handleDuplicate(row.original._id)}
                title="Duplicate Course"
                aria-label={`Duplicate ${row.original.title}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: isBusy ? 'wait' : 'pointer',
                  color: 'var(--color-muted)',
                  padding: '6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Copy size={16} />
              </button>
              <button
                disabled={isBusy}
                onClick={() => handleArchive(row.original)}
                title="Archive Course"
                aria-label={`Archive ${row.original.title}`}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: isBusy ? 'wait' : 'pointer',
                  color: 'var(--color-error)',
                  padding: '6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Archive size={16} />
              </button>
            </div>
          );
        },
      },
    ],
    [actionLoadingId, router],
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
              Courses (CS1)
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
              Masterclasses, interactive video lessons, and curriculum tracks
            </p>
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setCreateForm({
                title: '',
                slug: '',
                categoryId: categories[0]?._id || '',
                priceInr: 0,
              });
              setCreateErrors({});
              setIsCreateModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>New Course</span>
          </Button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(229, 72, 77, 0.15)',
              border: '1px solid var(--color-error)',
              borderRadius: '8px',
              color: 'var(--color-error)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Filters Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            padding: '16px',
            backgroundColor: 'var(--color-slate)',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Status Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {STATUS_TABS.map((tab) => {
              const active = selectedStatus === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedStatus(tab)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: active ? 600 : 500,
                    backgroundColor: active ? 'var(--color-orange)' : 'transparent',
                    color: active ? 'var(--color-navy)' : 'var(--color-muted)',
                    border: 'none',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Secondary Dropdown Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title..."
              style={{
                padding: '6px 12px',
                backgroundColor: '#0A233A',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-white)',
                fontSize: '13px',
                outline: 'none',
              }}
            />

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#0A233A',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-white)',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Price Type Filter */}
            <select
              value={priceType}
              onChange={(e) => setPriceType(e.target.value as 'all' | 'free' | 'paid')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#0A233A',
                border: '1px solid var(--color-border)',
                borderRadius: '6px',
                color: 'var(--color-white)',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Pricing</option>
              <option value="free">Free Courses</option>
              <option value="paid">Paid Courses</option>
            </select>
          </div>
        </div>

        {/* Courses Table */}
        <DataTable
          columns={columns}
          data={courses}
          isLoading={isLoading}
          searchPlaceholder="Search courses by title or slug..."
          emptyTitle="No courses found"
          emptyDescription="Create your first masterclass course or adjust filter criteria."
        />

        {/* Quick Create Modal */}
        {isCreateModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
                maxWidth: '500px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                }}
              >
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-white)' }}>
                  Create New Course
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-muted)',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {createErrors.form && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(229, 72, 77, 0.15)',
                    border: '1px solid var(--color-error)',
                    borderRadius: '6px',
                    color: 'var(--color-error)',
                    fontSize: '13px',
                  }}
                >
                  {createErrors.form}
                </div>
              )}

              <form onSubmit={handleQuickCreate}>
                <FormField
                  label="Course Title"
                  required
                  error={createErrors.title}
                  htmlFor="new-course-title"
                >
                  <input
                    id="new-course-title"
                    type="text"
                    value={createForm.title}
                    onChange={handleTitleChange}
                    placeholder="e.g. Pre-Seed Capital Raising & Term Sheets"
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#0A233A',
                      border: `1px solid ${createErrors.title ? 'var(--color-error)' : 'var(--color-border)'}`,
                      borderRadius: '8px',
                      color: 'var(--color-white)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </FormField>

                <FormField
                  label="URL Slug"
                  required
                  error={createErrors.slug}
                  helperText="Permanent identifier"
                  htmlFor="new-course-slug"
                >
                  <input
                    id="new-course-slug"
                    type="text"
                    value={createForm.slug}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, slug: e.target.value }))}
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

                <FormField
                  label="Category"
                  required
                  error={createErrors.categoryId}
                  htmlFor="new-course-category"
                >
                  <select
                    id="new-course-category"
                    value={createForm.categoryId}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, categoryId: e.target.value }))
                    }
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#0A233A',
                      border: `1px solid ${createErrors.categoryId ? 'var(--color-error)' : 'var(--color-border)'}`,
                      borderRadius: '8px',
                      color: 'var(--color-white)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  >
                    <option value="">Select a category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Price (INR ₹)"
                  helperText="Enter 0 for a free course"
                  htmlFor="new-course-price"
                >
                  <input
                    id="new-course-price"
                    type="number"
                    min="0"
                    step="1"
                    value={createForm.priceInr}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        priceInr: Math.max(0, parseInt(e.target.value, 10) || 0),
                      }))
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
                  />
                </FormField>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '12px',
                    marginTop: '24px',
                  }}
                >
                  <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isSubmitting}>
                    Continue to Editor
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
