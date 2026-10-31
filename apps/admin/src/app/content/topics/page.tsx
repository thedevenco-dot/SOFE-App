'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2, Hash, AlertCircle, X } from 'lucide-react';
import { AdminShell } from '../../../components/layout/AdminShell';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FormField } from '../../../components/ui/FormField';
import { adminApiClient } from '../../../lib/api-client';

export interface TopicItem {
  _id: string;
  name: string;
  slug: string;
  order: number;
  isTab: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTopic, setEditingTopic] = useState<TopicItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    order: 0,
    isTab: false,
    description: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete State
  const [deletingTopic, setDeletingTopic] = useState<TopicItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchTopics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.get<TopicItem[]>('/admin/topics');
      setTopics(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch topics';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const openCreateModal = () => {
    setEditingTopic(null);
    setFormData({
      name: '',
      slug: '',
      order: topics.length + 1,
      isTab: false,
      description: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (t: TopicItem) => {
    setEditingTopic(t);
    setFormData({
      name: t.name,
      slug: t.slug,
      order: t.order,
      isTab: t.isTab,
      description: t.description || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!editingTopic) {
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData((prev) => ({ ...prev, name, slug: generatedSlug }));
    } else {
      setFormData((prev) => ({ ...prev, name }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Topic name is required';
    if (!formData.slug.trim()) errors.slug = 'Slug is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormErrors({});
    try {
      if (editingTopic) {
        await adminApiClient.put(`/admin/topics/${editingTopic._id}`, {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          order: Number(formData.order),
          isTab: Boolean(formData.isTab),
          description: formData.description.trim() || undefined,
        });
      } else {
        await adminApiClient.post('/admin/topics', {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          order: Number(formData.order),
          isTab: Boolean(formData.isTab),
          description: formData.description.trim() || undefined,
        });
      }
      setIsModalOpen(false);
      await fetchTopics();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setFormErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTopic) return;
    setIsDeleting(true);
    try {
      await adminApiClient.delete(`/admin/topics/${deletingTopic._id}`);
      setDeletingTopic(null);
      await fetchTopics();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete topic';
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<TopicItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Topic',
        cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 132, 41, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-orange)',
              }}
            >
              <Hash size={16} />
            </div>
            <div>
              <span style={{ fontWeight: 600, color: 'var(--color-white)', fontSize: '14px' }}>
                {row.original.name}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'slug',
        header: 'Slug',
        cell: ({ row }) => (
          <code
            style={{
              padding: '2px 8px',
              backgroundColor: '#0F273D',
              borderRadius: '4px',
              fontSize: '12px',
              color: 'var(--color-orange)',
              border: '1px solid var(--color-border)',
            }}
          >
            {row.original.slug}
          </code>
        ),
      },
      {
        accessorKey: 'order',
        header: 'Order',
        cell: ({ row }) => (
          <span style={{ fontWeight: 600, color: 'var(--color-muted)', fontSize: '13px' }}>
            #{row.original.order}
          </span>
        ),
      },
      {
        accessorKey: 'isTab',
        header: 'Tab Navigation',
        cell: ({ row }) => (
          <Badge variant={row.original.isTab ? 'published' : 'draft'}>
            {row.original.isTab ? 'Tab Enabled' : 'Tag Only'}
          </Badge>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <span
            style={{
              fontSize: '13px',
              color: 'var(--color-muted)',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              maxWidth: '240px',
            }}
          >
            {row.original.description || '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => openEditModal(row.original)}
              title="Edit Topic"
              aria-label={`Edit ${row.original.name}`}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-muted)',
                padding: '6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => setDeletingTopic(row.original)}
              title="Delete Topic"
              aria-label={`Delete ${row.original.name}`}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-error)',
                padding: '6px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    [],
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
              Startup World Topics (CS15)
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
              Organize articles, news, and insights by topic and configure tab navigation
            </p>
          </div>

          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Topic</span>
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

        {/* Topics Table */}
        <DataTable
          columns={columns}
          data={topics}
          isLoading={isLoading}
          searchPlaceholder="Search topics by name..."
          emptyTitle="No topics created"
          emptyDescription="Create topics to tag Startup World articles."
        />

        {/* Create / Edit Modal */}
        {isModalOpen && (
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
                maxWidth: '480px',
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
                <h2
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: 'var(--color-white)',
                  }}
                >
                  {editingTopic ? 'Edit Topic' : 'Create Topic'}
                </h2>
                <button
                  onClick={() => setIsModalOpen(false)}
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

              {formErrors.form && (
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
                  {formErrors.form}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <FormField label="Topic Name" required error={formErrors.name} htmlFor="topic-name">
                  <input
                    id="topic-name"
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Fundraising, AI, Growth"
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#0A233A',
                      border: `1px solid ${formErrors.name ? 'var(--color-error)' : 'var(--color-border)'}`,
                      borderRadius: '8px',
                      color: 'var(--color-white)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </FormField>

                <FormField
                  label="Slug"
                  required
                  error={formErrors.slug}
                  helperText="URL-friendly identifier"
                  htmlFor="topic-slug"
                >
                  <input
                    id="topic-slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g. fundraising"
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#0A233A',
                      border: `1px solid ${formErrors.slug ? 'var(--color-error)' : 'var(--color-border)'}`,
                      borderRadius: '8px',
                      color: 'var(--color-white)',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                </FormField>

                <FormField label="Display Order" error={formErrors.order} htmlFor="topic-order">
                  <input
                    id="topic-order"
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, order: parseInt(e.target.value, 10) || 0 }))
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

                {/* isTab Checkbox */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px',
                    padding: '10px 12px',
                    backgroundColor: '#0A233A',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <input
                    type="checkbox"
                    id="topic-isTab"
                    checked={formData.isTab}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isTab: e.target.checked }))}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--color-orange)',
                      cursor: 'pointer',
                    }}
                  />
                  <label
                    htmlFor="topic-isTab"
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--color-white)',
                      cursor: 'pointer',
                    }}
                  >
                    Feature as top navigation tab in mobile app
                  </label>
                </div>

                <FormField
                  label="Description"
                  error={formErrors.description}
                  htmlFor="topic-description"
                >
                  <textarea
                    id="topic-description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Brief description of stories in this topic..."
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#0A233A',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-white)',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
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
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isSubmitting}>
                    {editingTopic ? 'Save Changes' : 'Create Topic'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingTopic && (
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
                maxWidth: '420px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
              }}
            >
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--color-white)',
                  marginBottom: '12px',
                }}
              >
                Delete Topic
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted)', lineHeight: '1.5' }}>
                Are you sure you want to delete topic{' '}
                <strong style={{ color: 'var(--color-white)' }}>{deletingTopic.name}</strong>? This
                may affect article filtering.
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '24px',
                }}
              >
                <Button variant="ghost" onClick={() => setDeletingTopic(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" isLoading={isDeleting} onClick={handleDelete}>
                  Delete Topic
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
