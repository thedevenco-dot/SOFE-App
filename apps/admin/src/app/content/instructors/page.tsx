'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2, AlertCircle, X, ExternalLink } from 'lucide-react';
import { AdminShell } from '../../../components/layout/AdminShell';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/ui/FormField';
import { adminApiClient } from '../../../lib/api-client';

export interface InstructorItem {
  _id: string;
  name: string;
  title?: string;
  bio?: string;
  avatarUrl?: string;
  links: string[];
  userId?: string;
}

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<InstructorItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingInstructor, setEditingInstructor] = useState<InstructorItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    avatarUrl: '',
    linksRaw: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete State
  const [deletingInstructor, setDeletingInstructor] = useState<InstructorItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchInstructors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.get<InstructorItem[]>('/admin/instructors');
      setInstructors(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch instructors';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstructors();
  }, [fetchInstructors]);

  const openCreateModal = () => {
    setEditingInstructor(null);
    setFormData({
      name: '',
      title: '',
      bio: '',
      avatarUrl: '',
      linksRaw: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (inst: InstructorItem) => {
    setEditingInstructor(inst);
    setFormData({
      name: inst.name,
      title: inst.title || '',
      bio: inst.bio || '',
      avatarUrl: inst.avatarUrl || '',
      linksRaw: (inst.links || []).join('\n'),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (formData.avatarUrl && !formData.avatarUrl.startsWith('http')) {
      errors.avatarUrl = 'Must be a valid HTTP/HTTPS URL';
    }

    const rawLinks = formData.linksRaw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    for (const link of rawLinks) {
      if (!link.startsWith('http')) {
        errors.linksRaw = `Invalid link: "${link}". Must start with http:// or https://`;
        break;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormErrors({});

    const parsedLinks = formData.linksRaw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    try {
      if (editingInstructor) {
        await adminApiClient.put(`/admin/instructors/${editingInstructor._id}`, {
          name: formData.name.trim(),
          title: formData.title.trim() || undefined,
          bio: formData.bio.trim() || undefined,
          avatarUrl: formData.avatarUrl.trim() || undefined,
          links: parsedLinks,
        });
      } else {
        await adminApiClient.post('/admin/instructors', {
          name: formData.name.trim(),
          title: formData.title.trim() || undefined,
          bio: formData.bio.trim() || undefined,
          avatarUrl: formData.avatarUrl.trim() || undefined,
          links: parsedLinks,
        });
      }
      setIsModalOpen(false);
      await fetchInstructors();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setFormErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingInstructor) return;
    setIsDeleting(true);
    try {
      await adminApiClient.delete(`/admin/instructors/${deletingInstructor._id}`);
      setDeletingInstructor(null);
      await fetchInstructors();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete instructor';
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

  const columns = useMemo<ColumnDef<InstructorItem>[]>(
    () => [
      {
        accessorKey: 'avatarUrl',
        header: 'Instructor',
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
              maxWidth: '300px',
            }}
          >
            {row.original.bio || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'links',
        header: 'Links',
        cell: ({ row }) => {
          const links = row.original.links || [];
          if (links.length === 0) {
            return <span style={{ color: 'var(--color-muted)', fontSize: '12px' }}>—</span>;
          }
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '12px',
                  backgroundColor: '#0F273D',
                  color: 'var(--color-orange)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                }}
              >
                {links.length} {links.length === 1 ? 'link' : 'links'}
              </span>
              <a
                href={links[0]}
                target="_blank"
                rel="noopener noreferrer"
                title={links[0]}
                style={{ color: 'var(--color-muted)' }}
              >
                <ExternalLink size={14} />
              </a>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => openEditModal(row.original)}
              title="Edit Instructor"
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
              onClick={() => setDeletingInstructor(row.original)}
              title="Delete Instructor"
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
              Instructors (CS9)
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
              Manage teachers, founders, and industry experts for video courses
            </p>
          </div>

          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Instructor</span>
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

        {/* Instructors Table */}
        <DataTable
          columns={columns}
          data={instructors}
          isLoading={isLoading}
          searchPlaceholder="Search instructors by name..."
          emptyTitle="No instructors found"
          emptyDescription="Add instructors who create courses and teach masterclasses."
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
                maxWidth: '520px',
                padding: '24px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                maxHeight: '90vh',
                overflowY: 'auto',
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
                  {editingInstructor ? 'Edit Instructor' : 'Add Instructor'}
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
                  label="Full Name"
                  required
                  error={formErrors.name}
                  htmlFor="instructor-name"
                >
                  <input
                    id="instructor-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Marc Andreessen"
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

                <FormField label="Title / Role" error={formErrors.title} htmlFor="instructor-title">
                  <input
                    id="instructor-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Co-founder & GP at Andreessen Horowitz"
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

                <FormField label="Bio" error={formErrors.bio} htmlFor="instructor-bio">
                  <textarea
                    id="instructor-bio"
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                    placeholder="Brief background and expertise..."
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
                  helperText="Public image link or Cloudinary asset"
                  htmlFor="instructor-avatar"
                >
                  <input
                    id="instructor-avatar"
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

                <FormField
                  label="Links (One per line)"
                  error={formErrors.linksRaw}
                  helperText="Social profiles, personal websites, or articles"
                  htmlFor="instructor-links"
                >
                  <textarea
                    id="instructor-links"
                    rows={3}
                    value={formData.linksRaw}
                    onChange={(e) => setFormData((prev) => ({ ...prev, linksRaw: e.target.value }))}
                    placeholder="https://x.com/founder&#10;https://linkedin.com/in/founder"
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#0A233A',
                      border: `1px solid ${formErrors.linksRaw ? 'var(--color-error)' : 'var(--color-border)'}`,
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
                    {editingInstructor ? 'Save Changes' : 'Create Instructor'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingInstructor && (
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
                Delete Instructor
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted)', lineHeight: '1.5' }}>
                Are you sure you want to delete instructor{' '}
                <strong style={{ color: 'var(--color-white)' }}>{deletingInstructor.name}</strong>?
                This may affect linked courses.
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
                <Button variant="ghost" onClick={() => setDeletingInstructor(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" isLoading={isDeleting} onClick={handleDelete}>
                  Delete Instructor
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
