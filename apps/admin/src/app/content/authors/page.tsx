'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2, AlertCircle, X } from 'lucide-react';
import { AdminShell } from '../../../components/layout/AdminShell';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/ui/FormField';
import { adminApiClient } from '../../../lib/api-client';

export interface AuthorItem {
  _id: string;
  name: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AuthorsPage() {
  const [authors, setAuthors] = useState<AuthorItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAuthor, setEditingAuthor] = useState<AuthorItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    avatarUrl: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete State
  const [deletingAuthor, setDeletingAuthor] = useState<AuthorItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchAuthors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.get<AuthorItem[]>('/admin/authors');
      setAuthors(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch authors';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  const openCreateModal = () => {
    setEditingAuthor(null);
    setFormData({
      name: '',
      title: '',
      bio: '',
      avatarUrl: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (author: AuthorItem) => {
    setEditingAuthor(author);
    setFormData({
      name: author.name,
      title: author.title || '',
      bio: author.bio || '',
      avatarUrl: author.avatarUrl || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Author name is required';
    if (formData.avatarUrl && !formData.avatarUrl.startsWith('http')) {
      errors.avatarUrl = 'Must be a valid HTTP/HTTPS URL';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormErrors({});
    try {
      if (editingAuthor) {
        await adminApiClient.put(`/admin/authors/${editingAuthor._id}`, {
          name: formData.name.trim(),
          title: formData.title.trim() || undefined,
          bio: formData.bio.trim() || undefined,
          avatarUrl: formData.avatarUrl.trim() || undefined,
        });
      } else {
        await adminApiClient.post('/admin/authors', {
          name: formData.name.trim(),
          title: formData.title.trim() || undefined,
          bio: formData.bio.trim() || undefined,
          avatarUrl: formData.avatarUrl.trim() || undefined,
        });
      }
      setIsModalOpen(false);
      await fetchAuthors();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setFormErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAuthor) return;
    setIsDeleting(true);
    try {
      await adminApiClient.delete(`/admin/authors/${deletingAuthor._id}`);
      setDeletingAuthor(null);
      await fetchAuthors();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete author';
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const columns = useMemo<ColumnDef<AuthorItem>[]>(
    () => [
      {
        accessorKey: 'avatarUrl',
        header: 'Author',
        cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#1E3A5F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                fontWeight: 700,
                fontSize: '13px',
                color: 'var(--color-orange)',
                flexShrink: 0,
              }}
            >
              {row.original.avatarUrl ? (
                <img
                  src={row.original.avatarUrl}
                  alt={row.original.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                getInitials(row.original.name)
              )}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--color-white)', fontSize: '14px' }}>
                {row.original.name}
              </div>
              {row.original.title && (
                <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
                  {row.original.title}
                </div>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'bio',
        header: 'Bio',
        cell: ({ row }) => (
          <span
            style={{
              fontSize: '13px',
              color: 'var(--color-muted)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              maxWidth: '380px',
            }}
          >
            {row.original.bio || '—'}
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
              title="Edit Author"
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
              onClick={() => setDeletingAuthor(row.original)}
              title="Delete Author"
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
              Article Authors (CS16)
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
              Manage contributing authors, thought leaders, and editors for Startup World
            </p>
          </div>

          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Author</span>
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

        {/* Authors Table */}
        <DataTable
          columns={columns}
          data={authors}
          isLoading={isLoading}
          searchPlaceholder="Search authors by name..."
          emptyTitle="No authors found"
          emptyDescription="Add article authors who write essays, analyses, and stories."
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
                  {editingAuthor ? 'Edit Author' : 'Add Author'}
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
                <FormField
                  label="Author Name"
                  required
                  error={formErrors.name}
                  htmlFor="author-name"
                >
                  <input
                    id="author-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Paul Graham"
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
                  label="Title / Affiliation"
                  error={formErrors.title}
                  htmlFor="author-title"
                >
                  <input
                    id="author-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Essayist & Co-founder at Y Combinator"
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

                <FormField label="Bio" error={formErrors.bio} htmlFor="author-bio">
                  <textarea
                    id="author-bio"
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Brief author bio..."
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

                <FormField
                  label="Avatar URL"
                  error={formErrors.avatarUrl}
                  helperText="Optional image URL for the author profile"
                  htmlFor="author-avatar"
                >
                  <input
                    id="author-avatar"
                    type="text"
                    value={formData.avatarUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, avatarUrl: e.target.value }))
                    }
                    placeholder="https://..."
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#0A233A',
                      border: `1px solid ${formErrors.avatarUrl ? 'var(--color-error)' : 'var(--color-border)'}`,
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
                  <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" isLoading={isSubmitting}>
                    {editingAuthor ? 'Save Changes' : 'Create Author'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingAuthor && (
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
                Delete Author
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted)', lineHeight: '1.5' }}>
                Are you sure you want to delete author{' '}
                <strong style={{ color: 'var(--color-white)' }}>{deletingAuthor.name}</strong>? This
                may affect article attribution.
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
                <Button variant="ghost" onClick={() => setDeletingAuthor(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" isLoading={isDeleting} onClick={handleDelete}>
                  Delete Author
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
