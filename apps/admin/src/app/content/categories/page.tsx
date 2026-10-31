'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Plus, Edit2, Trash2, Layers, AlertCircle, X } from 'lucide-react';
import { AdminShell } from '../../../components/layout/AdminShell';
import { DataTable } from '../../../components/ui/DataTable';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/ui/FormField';
import { adminApiClient } from '../../../lib/api-client';

export interface CategoryItem {
  _id: string;
  name: string;
  slug: string;
  order: number;
  iconUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', order: 0, iconUrl: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete State
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.get<CategoryItem[]>('/admin/course-categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch categories';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', order: categories.length + 1, iconUrl: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      slug: cat.slug,
      order: cat.order,
      iconUrl: cat.iconUrl || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (!editingCategory) {
      // Auto-generate slug on create
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
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.slug.trim()) errors.slug = 'Slug is required';
    if (formData.iconUrl && !formData.iconUrl.startsWith('http')) {
      errors.iconUrl = 'Must be a valid HTTP/HTTPS URL';
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
      if (editingCategory) {
        await adminApiClient.put(`/admin/course-categories/${editingCategory._id}`, {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          order: Number(formData.order),
          iconUrl: formData.iconUrl.trim() || undefined,
        });
      } else {
        await adminApiClient.post('/admin/course-categories', {
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          order: Number(formData.order),
          iconUrl: formData.iconUrl.trim() || undefined,
        });
      }
      setIsModalOpen(false);
      await fetchCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      setFormErrors({ form: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    setIsDeleting(true);
    try {
      await adminApiClient.delete(`/admin/course-categories/${deletingCategory._id}`);
      setDeletingCategory(null);
      await fetchCategories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete category';
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<CategoryItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Category Name',
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
              <Layers size={16} />
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
          <span
            style={{
              fontWeight: 600,
              color: 'var(--color-muted)',
              fontSize: '13px',
            }}
          >
            #{row.original.order}
          </span>
        ),
      },
      {
        accessorKey: 'iconUrl',
        header: 'Icon',
        cell: ({ row }) =>
          row.original.iconUrl ? (
            <span
              style={{
                fontSize: '11px',
                color: 'var(--color-muted)',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
            >
              {row.original.iconUrl}
            </span>
          ) : (
            <span style={{ color: 'var(--color-muted)', fontSize: '12px' }}>—</span>
          ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => openEditModal(row.original)}
              title="Edit Category"
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
              onClick={() => setDeletingCategory(row.original)}
              title="Delete Category"
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
              Course Categories (CS8)
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
              Manage curriculum domains, tracks, and course groupings
            </p>
          </div>

          <Button variant="primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Category</span>
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

        {/* Categories Table */}
        <DataTable
          columns={columns}
          data={categories}
          isLoading={isLoading}
          searchPlaceholder="Search categories by name..."
          emptyTitle="No categories created"
          emptyDescription="Create your first course category to organize learning modules."
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
                  {editingCategory ? 'Edit Category' : 'Create Category'}
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
                  label="Category Name"
                  required
                  error={formErrors.name}
                  htmlFor="category-name"
                >
                  <input
                    id="category-name"
                    type="text"
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. Fundraising, Tech, Validation"
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
                  htmlFor="category-slug"
                >
                  <input
                    id="category-slug"
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

                <FormField label="Display Order" error={formErrors.order} htmlFor="category-order">
                  <input
                    id="category-order"
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

                <FormField
                  label="Icon URL"
                  error={formErrors.iconUrl}
                  helperText="Optional remote image or svg asset"
                  htmlFor="category-icon"
                >
                  <input
                    id="category-icon"
                    type="text"
                    value={formData.iconUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, iconUrl: e.target.value }))}
                    placeholder="https://..."
                    style={{
                      padding: '10px 12px',
                      backgroundColor: '#0A233A',
                      border: `1px solid ${formErrors.iconUrl ? 'var(--color-error)' : 'var(--color-border)'}`,
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
                    {editingCategory ? 'Save Changes' : 'Create Category'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingCategory && (
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
                Delete Category
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-muted)', lineHeight: '1.5' }}>
                Are you sure you want to delete category{' '}
                <strong style={{ color: 'var(--color-white)' }}>{deletingCategory.name}</strong>?
                This action cannot be undone.
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
                <Button variant="ghost" onClick={() => setDeletingCategory(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" isLoading={isDeleting} onClick={handleDelete}>
                  Delete Category
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
