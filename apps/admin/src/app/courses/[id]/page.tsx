'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Video,
  FileText,
  HelpCircle,
  Link as LinkIcon,
  Copy,
  AlertCircle,
  Check,
} from 'lucide-react';
import { AdminShell } from '../../../components/layout/AdminShell';
import { Button } from '../../../components/ui/Button';
import { Badge, BadgeVariant } from '../../../components/ui/Badge';
import { FormField } from '../../../components/ui/FormField';
import { adminApiClient } from '../../../lib/api-client';

interface LessonDetail {
  _id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz' | 'resource';
  status: 'draft' | 'published';
  durationSec?: number;
  isFreePreview?: boolean;
  isRequired?: boolean;
}

interface ModuleDetail {
  _id: string;
  title: string;
  order: number;
  lessonIds: string[];
  lessons?: LessonDetail[];
}

interface CourseFullData {
  _id: string;
  title: string;
  slug: string;
  subtitle?: string;
  descriptionHtml?: string;
  thumbnailUrl: string;
  previewMuxPlaybackId?: string;
  categoryId?: { _id: string; name: string };
  instructorIds?: Array<{ _id: string; name: string }>;
  tags: string[];
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  priceInr: number;
  compareAtPriceInr?: number;
  iapProductIds?: { ios?: string; android?: string };
  redeemableWithPoints?: boolean;
  status: 'draft' | 'review' | 'published' | 'archived';
  version: number;
  modules: ModuleDetail[];
  stats?: {
    enrolledCount: number;
    ratingAvg: number;
    ratingCount: number;
    lessonCount: number;
    durationSec: number;
  };
}

interface CategoryOption {
  _id: string;
  name: string;
}

interface InstructorOption {
  _id: string;
  name: string;
  title?: string;
}

interface PublishCheckItem {
  key: string;
  label: string;
  passed: boolean;
  details?: string;
}

interface PublishChecklistData {
  canPublish: boolean;
  checks: PublishCheckItem[];
}

type EditorTab = 'details' | 'curriculum' | 'pricing' | 'checklist';

export default function CourseEditorPage() {
  const router = useRouter();
  const routeParams = useParams();
  const courseId = (routeParams?.id as string) || '';

  const [course, setCourse] = useState<CourseFullData | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);
  const [checklist, setChecklist] = useState<PublishChecklistData | null>(null);

  const [activeTab, setActiveTab] = useState<EditorTab>('details');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Details Form State
  const [detailsForm, setDetailsForm] = useState({
    title: '',
    slug: '',
    subtitle: '',
    descriptionHtml: '',
    thumbnailUrl: '',
    previewMuxPlaybackId: '',
    categoryId: '',
    instructorIds: [] as string[],
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    language: 'en',
    tagsRaw: '',
  });

  // Pricing Form State
  const [pricingForm, setPricingForm] = useState({
    isFree: true,
    priceRupees: 0,
    compareAtRupees: 0,
    iosIap: '',
    androidIap: '',
    redeemableWithPoints: false,
  });

  // Curriculum State
  const [modules, setModules] = useState<ModuleDetail[]>([]);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState<number>(0);
  const [isAddLessonModalOpen, setIsAddLessonModalOpen] = useState<boolean>(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState<'video' | 'reading' | 'quiz' | 'resource'>(
    'video',
  );

  const fetchCourseData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.get<CourseFullData>(`/admin/courses/${courseId}`);
      setCourse(data);

      setDetailsForm({
        title: data.title,
        slug: data.slug,
        subtitle: data.subtitle || '',
        descriptionHtml: data.descriptionHtml || '',
        thumbnailUrl: data.thumbnailUrl || '',
        previewMuxPlaybackId: data.previewMuxPlaybackId || '',
        categoryId: data.categoryId?._id || '',
        instructorIds: (data.instructorIds || []).map((i) => i._id),
        level: data.level || 'beginner',
        language: data.language || 'en',
        tagsRaw: (data.tags || []).join(', '),
      });

      const pricePaise = data.priceInr || 0;
      setPricingForm({
        isFree: pricePaise === 0,
        priceRupees: pricePaise / 100,
        compareAtRupees: (data.compareAtPriceInr || 0) / 100,
        iosIap: data.iapProductIds?.ios || '',
        androidIap: data.iapProductIds?.android || '',
        redeemableWithPoints: Boolean(data.redeemableWithPoints),
      });

      setModules(data.modules || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load course');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  const fetchChecklist = useCallback(async () => {
    try {
      const data = await adminApiClient.get<PublishChecklistData>(
        `/admin/courses/${courseId}/publish-checklist`,
      );
      setChecklist(data);
    } catch {
      // non-blocking
    }
  }, [courseId]);

  const fetchOptions = useCallback(async () => {
    try {
      const [cats, insts] = await Promise.all([
        adminApiClient.get<CategoryOption[]>('/admin/course-categories'),
        adminApiClient.get<InstructorOption[]>('/admin/instructors'),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setInstructors(Array.isArray(insts) ? insts : []);
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    fetchCourseData();
    fetchOptions();
  }, [fetchCourseData, fetchOptions]);

  useEffect(() => {
    if (activeTab === 'checklist') {
      fetchChecklist();
    }
  }, [activeTab, fetchChecklist]);

  // Save Details and Pricing
  const handleSaveCourse = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const parsedTags = detailsForm.tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const pricePaise = pricingForm.isFree ? 0 : Math.round(pricingForm.priceRupees * 100);
      const compareAtPaise =
        pricingForm.isFree || !pricingForm.compareAtRupees
          ? undefined
          : Math.round(pricingForm.compareAtRupees * 100);

      const updated = await adminApiClient.put<CourseFullData>(`/admin/courses/${courseId}`, {
        title: detailsForm.title.trim(),
        slug: detailsForm.slug.trim(),
        subtitle: detailsForm.subtitle.trim() || undefined,
        descriptionHtml: detailsForm.descriptionHtml || undefined,
        thumbnailUrl: detailsForm.thumbnailUrl.trim(),
        previewMuxPlaybackId: detailsForm.previewMuxPlaybackId.trim() || undefined,
        categoryId: detailsForm.categoryId,
        instructorIds: detailsForm.instructorIds,
        level: detailsForm.level,
        language: detailsForm.language,
        tags: parsedTags,
        priceInr: pricePaise,
        compareAtPriceInr: compareAtPaise,
        iapProductIds: {
          ios: pricingForm.iosIap.trim() || undefined,
          android: pricingForm.androidIap.trim() || undefined,
        },
        redeemableWithPoints: pricingForm.redeemableWithPoints,
      });

      setCourse(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchChecklist();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save course changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Curriculum Handlers
  const handleAddModule = () => {
    const newMod: ModuleDetail = {
      _id: `temp-${Date.now()}`,
      title: `Section ${modules.length + 1}: Getting Started`,
      order: modules.length,
      lessonIds: [],
      lessons: [],
    };
    const updated = [...modules, newMod];
    setModules(updated);
    setSelectedModuleIndex(updated.length - 1);
  };

  const handleRenameModule = (index: number, newTitle: string) => {
    const updated = [...modules];
    updated[index].title = newTitle;
    setModules(updated);
  };

  const handleMoveModule = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= modules.length) return;
    const updated = [...modules];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    updated.forEach((m, idx) => (m.order = idx));
    setModules(updated);
    setSelectedModuleIndex(targetIndex);
  };

  const handleDeleteModule = (index: number) => {
    if (!confirm('Remove this module from the curriculum?')) return;
    const updated = modules.filter((_, idx) => idx !== index);
    updated.forEach((m, idx) => (m.order = idx));
    setModules(updated);
    setSelectedModuleIndex(Math.max(0, index - 1));
  };

  const handleAddLesson = () => {
    if (!newLessonTitle.trim()) return;
    const activeMod = modules[selectedModuleIndex];
    if (!activeMod) return;

    const fakeLessonId = `temp-lesson-${Date.now()}`;
    const newLesson: LessonDetail = {
      _id: fakeLessonId,
      title: newLessonTitle.trim(),
      type: newLessonType,
      status: 'published',
      durationSec: newLessonType === 'video' ? 600 : 300,
      isFreePreview: false,
      isRequired: true,
    };

    const updatedModules = [...modules];
    const currentLessons = activeMod.lessons || [];
    updatedModules[selectedModuleIndex] = {
      ...activeMod,
      lessonIds: [...activeMod.lessonIds, fakeLessonId],
      lessons: [...currentLessons, newLesson],
    };

    setModules(updatedModules);
    setNewLessonTitle('');
    setIsAddLessonModalOpen(false);
  };

  const handleToggleFreePreview = (lessonIndex: number) => {
    const activeMod = modules[selectedModuleIndex];
    if (!activeMod || !activeMod.lessons) return;
    const updatedLessons = [...activeMod.lessons];
    updatedLessons[lessonIndex].isFreePreview = !updatedLessons[lessonIndex].isFreePreview;

    const updatedModules = [...modules];
    updatedModules[selectedModuleIndex] = {
      ...activeMod,
      lessons: updatedLessons,
    };
    setModules(updatedModules);
  };

  const handleSaveCurriculum = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        modules: modules.map((m, idx) => ({
          _id: m._id.startsWith('temp') ? undefined : m._id,
          title: m.title,
          order: idx,
          lessonIds: (m.lessons || []).map((l) => l._id),
        })),
      };

      const updated = await adminApiClient.put<CourseFullData>(
        `/admin/courses/${courseId}/curriculum`,
        payload,
      );
      setCourse(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchChecklist();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save curriculum');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish / Unpublish / Duplicate
  const handlePublish = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await adminApiClient.post<CourseFullData>(
        `/admin/courses/${courseId}/publish`,
      );
      setCourse(updated);
      fetchChecklist();
      alert('Course successfully published! A version snapshot was recorded.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('Revert course status back to Draft?')) return;
    setIsSaving(true);
    try {
      const updated = await adminApiClient.post<CourseFullData>(
        `/admin/courses/${courseId}/unpublish`,
      );
      setCourse(updated);
      fetchChecklist();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unpublish failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicate = async () => {
    try {
      const cloned = await adminApiClient.post<CourseFullData>(
        `/admin/courses/${courseId}/duplicate`,
      );
      router.push(`/courses/${cloned._id}`);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Duplicate failed');
    }
  };

  if (isLoading) {
    return (
      <AdminShell>
        <div style={{ color: 'var(--color-muted)', padding: '40px', textAlign: 'center' }}>
          Loading Course Editor...
        </div>
      </AdminShell>
    );
  }

  if (!course) {
    return (
      <AdminShell>
        <div style={{ color: 'var(--color-error)', padding: '40px', textAlign: 'center' }}>
          Course not found.
        </div>
      </AdminShell>
    );
  }

  const activeModule = modules[selectedModuleIndex];
  const activeLessons = activeModule?.lessons || [];

  return (
    <AdminShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => router.push('/courses')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '6px',
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'var(--color-white)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {course.title}
                </h1>
                <Badge variant={course.status as BadgeVariant}>{course.status.toUpperCase()}</Badge>
                <span
                  style={{
                    fontSize: '12px',
                    padding: '2px 6px',
                    backgroundColor: '#0F273D',
                    borderRadius: '4px',
                    color: 'var(--color-orange)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  v{course.version || 1}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '2px' }}>
                /{course.slug}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {saveSuccess && (
              <span
                style={{
                  fontSize: '13px',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={16} /> Saved!
              </span>
            )}
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy size={16} />
              <span>Duplicate</span>
            </Button>
            {course.status === 'published' ? (
              <Button variant="outline" onClick={handleUnpublish}>
                Unpublish
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setActiveTab('checklist');
                  handlePublish();
                }}
              >
                Publish Course
              </Button>
            )}
            <Button
              variant="primary"
              isLoading={isSaving}
              onClick={activeTab === 'curriculum' ? handleSaveCurriculum : handleSaveCourse}
            >
              <Save size={16} />
              <span>Save Changes</span>
            </Button>
          </div>
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

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)' }}>
          {(
            [
              { key: 'details', label: '1. Details (CS2)' },
              { key: 'curriculum', label: '2. Curriculum (CS3)' },
              { key: 'pricing', label: '3. Pricing & Access (CS6)' },
              { key: 'checklist', label: '4. Publish Checklist' },
            ] as const
          ).map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  padding: '10px 18px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: active ? 'var(--color-orange)' : 'var(--color-muted)',
                  borderBottom: active ? '2px solid var(--color-orange)' : '2px solid transparent',
                  fontWeight: active ? 600 : 500,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: DETAILS (CS2) */}
        {/* ========================================================= */}
        {activeTab === 'details' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            <div
              style={{
                backgroundColor: 'var(--color-slate)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-white)' }}>
                Course Information
              </h2>

              <FormField label="Course Title" required htmlFor="course-title">
                <input
                  id="course-title"
                  type="text"
                  value={detailsForm.title}
                  onChange={(e) => setDetailsForm((prev) => ({ ...prev, title: e.target.value }))}
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
                label="URL Slug"
                required
                helperText="Permanent unique identifier"
                htmlFor="course-slug"
              >
                <input
                  id="course-slug"
                  type="text"
                  value={detailsForm.slug}
                  onChange={(e) => setDetailsForm((prev) => ({ ...prev, slug: e.target.value }))}
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

              <FormField label="Subtitle" htmlFor="course-subtitle">
                <input
                  id="course-subtitle"
                  type="text"
                  value={detailsForm.subtitle}
                  onChange={(e) =>
                    setDetailsForm((prev) => ({ ...prev, subtitle: e.target.value }))
                  }
                  placeholder="One-line hook summarizing the learning outcome"
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
                label="Course Description (HTML or Plain Text)"
                required
                helperText="Must be at least 100 characters to pass the publish checklist"
                htmlFor="course-description"
              >
                <textarea
                  id="course-description"
                  rows={6}
                  value={detailsForm.descriptionHtml}
                  onChange={(e) =>
                    setDetailsForm((prev) => ({ ...prev, descriptionHtml: e.target.value }))
                  }
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

              <FormField label="Tags (Comma separated)" htmlFor="course-tags">
                <input
                  id="course-tags"
                  type="text"
                  value={detailsForm.tagsRaw}
                  onChange={(e) => setDetailsForm((prev) => ({ ...prev, tagsRaw: e.target.value }))}
                  placeholder="fundraising, term-sheets, y-combinator"
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
            </div>

            {/* Right Column: Taxonomy, Level & Media */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  backgroundColor: 'var(--color-slate)',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-white)' }}>
                  Media & Visuals
                </h2>

                <FormField label="Thumbnail URL (16:9)" required htmlFor="course-thumb">
                  <input
                    id="course-thumb"
                    type="text"
                    value={detailsForm.thumbnailUrl}
                    onChange={(e) =>
                      setDetailsForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))
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

                {detailsForm.thumbnailUrl && (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '16/9',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid var(--color-border)',
                      backgroundColor: '#0A233A',
                    }}
                  >
                    <img
                      src={detailsForm.thumbnailUrl}
                      alt="Thumbnail Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}

                <FormField
                  label="Preview Mux Playback ID"
                  helperText="Optional trailer video playback ID"
                  htmlFor="course-preview-mux"
                >
                  <input
                    id="course-preview-mux"
                    type="text"
                    value={detailsForm.previewMuxPlaybackId}
                    onChange={(e) =>
                      setDetailsForm((prev) => ({ ...prev, previewMuxPlaybackId: e.target.value }))
                    }
                    placeholder="e.g. Sc4p78m..."
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
              </div>

              <div
                style={{
                  backgroundColor: 'var(--color-slate)',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-white)' }}>
                  Classification
                </h2>

                <FormField label="Category" required htmlFor="course-cat-select">
                  <select
                    id="course-cat-select"
                    value={detailsForm.categoryId}
                    onChange={(e) =>
                      setDetailsForm((prev) => ({ ...prev, categoryId: e.target.value }))
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
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Instructors" htmlFor="course-inst-select">
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '140px',
                      overflowY: 'auto',
                    }}
                  >
                    {instructors.map((inst) => {
                      const isChecked = detailsForm.instructorIds.includes(inst._id);
                      return (
                        <label
                          key={inst._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '13px',
                            color: 'var(--color-white)',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDetailsForm((prev) => ({
                                  ...prev,
                                  instructorIds: [...prev.instructorIds, inst._id],
                                }));
                              } else {
                                setDetailsForm((prev) => ({
                                  ...prev,
                                  instructorIds: prev.instructorIds.filter((id) => id !== inst._id),
                                }));
                              }
                            }}
                            style={{ accentColor: 'var(--color-orange)' }}
                          />
                          <span>{inst.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </FormField>

                <FormField label="Difficulty Level" htmlFor="course-level-select">
                  <select
                    id="course-level-select"
                    value={detailsForm.level}
                    onChange={(e) =>
                      setDetailsForm((prev) => ({
                        ...prev,
                        level: e.target.value as 'beginner' | 'intermediate' | 'advanced',
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
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </FormField>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: CURRICULUM BUILDER (CS3) */}
        {/* ========================================================= */}
        {activeTab === 'curriculum' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
            {/* Left: Modules List */}
            <div
              style={{
                backgroundColor: 'var(--color-slate)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-white)' }}>
                  Modules ({modules.length})
                </h2>
                <Button variant="outline" size="sm" onClick={handleAddModule}>
                  <Plus size={14} /> Add
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {modules.map((m, idx) => {
                  const active = idx === selectedModuleIndex;
                  return (
                    <div
                      key={m._id || idx}
                      onClick={() => setSelectedModuleIndex(idx)}
                      style={{
                        padding: '12px',
                        borderRadius: '8px',
                        border: `1px solid ${active ? 'var(--color-orange)' : 'var(--color-border)'}`,
                        backgroundColor: active ? 'rgba(255, 132, 41, 0.08)' : '#0A233A',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 600 }}
                        >
                          Section #{idx + 1}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            disabled={idx === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveModule(idx, 'up');
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-muted)',
                              cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            disabled={idx === modules.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveModule(idx, 'down');
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-muted)',
                              cursor: idx === modules.length - 1 ? 'not-allowed' : 'pointer',
                            }}
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteModule(idx);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--color-error)',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => handleRenameModule(idx, e.target.value)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--color-white)',
                          fontWeight: 600,
                          fontSize: '13px',
                          outline: 'none',
                        }}
                      />

                      <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                        {(m.lessons || []).length} lesson(s)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Module Lessons */}
            <div
              style={{
                backgroundColor: 'var(--color-slate)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
              }}
            >
              {activeModule ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <h2
                        style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-white)' }}
                      >
                        {activeModule.title}
                      </h2>
                      <p
                        style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '2px' }}
                      >
                        Curriculum content and interactive learning components
                      </p>
                    </div>

                    <Button variant="primary" onClick={() => setIsAddLessonModalOpen(true)}>
                      <Plus size={16} /> Add Lesson
                    </Button>
                  </div>

                  {activeLessons.length === 0 ? (
                    <div
                      style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: 'var(--color-muted)',
                        backgroundColor: '#0A233A',
                        borderRadius: '8px',
                        border: '1px dashed var(--color-border)',
                      }}
                    >
                      No lessons in this module yet. Click &quot;Add Lesson&quot; to build section
                      content.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {activeLessons.map((l, lIdx) => {
                        const iconMap = {
                          video: <Video size={16} color="var(--color-orange)" />,
                          reading: <FileText size={16} color="var(--color-muted)" />,
                          quiz: <HelpCircle size={16} color="var(--color-success)" />,
                          resource: <LinkIcon size={16} color="var(--color-muted)" />,
                        };
                        return (
                          <div
                            key={l._id || lIdx}
                            style={{
                              padding: '12px 16px',
                              backgroundColor: '#0A233A',
                              border: '1px solid var(--color-border)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: 'var(--color-muted)',
                                  width: '20px',
                                }}
                              >
                                #{lIdx + 1}
                              </span>
                              {iconMap[l.type] || <FileText size={16} />}
                              <div>
                                <span
                                  style={{
                                    fontWeight: 600,
                                    color: 'var(--color-white)',
                                    fontSize: '14px',
                                  }}
                                >
                                  {l.title}
                                </span>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginTop: '2px',
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      color: 'var(--color-muted)',
                                      textTransform: 'capitalize',
                                    }}
                                  >
                                    {l.type}
                                  </span>
                                  {l.durationSec && (
                                    <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                                      {Math.round(l.durationSec / 60)} min
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button
                                onClick={() => handleToggleFreePreview(lIdx)}
                                style={{
                                  fontSize: '11px',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  border: '1px solid var(--color-border)',
                                  backgroundColor: l.isFreePreview
                                    ? 'rgba(61, 214, 140, 0.15)'
                                    : 'transparent',
                                  color: l.isFreePreview
                                    ? 'var(--color-success)'
                                    : 'var(--color-muted)',
                                }}
                              >
                                {l.isFreePreview ? 'Free Preview' : 'Enrollment Locked'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: 'var(--color-muted)', padding: '20px' }}>
                  Please add or select a module.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PRICING & ACCESS (CS6) */}
        {/* ========================================================= */}
        {activeTab === 'pricing' && (
          <div
            style={{
              backgroundColor: 'var(--color-slate)',
              padding: '28px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              maxWidth: '640px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-white)' }}>
                Pricing & In-App Purchase Access
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
                Configure pricing in Indian Rupees (₹) and configure mobile store IAP bindings
              </p>
            </div>

            {/* Free Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                backgroundColor: '#0A233A',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
              }}
            >
              <input
                type="checkbox"
                id="isFree-toggle"
                checked={pricingForm.isFree}
                onChange={(e) =>
                  setPricingForm((prev) => ({
                    ...prev,
                    isFree: e.target.checked,
                    priceRupees: e.target.checked ? 0 : 2999,
                  }))
                }
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: 'var(--color-orange)',
                  cursor: 'pointer',
                }}
              />
              <label htmlFor="isFree-toggle" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-white)' }}>
                  Free Course
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                  All registered learners can access all lessons without purchasing
                </div>
              </label>
            </div>

            {!pricingForm.isFree && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <FormField label="Price (INR ₹)" required htmlFor="price-inr">
                    <input
                      id="price-inr"
                      type="number"
                      min="1"
                      value={pricingForm.priceRupees}
                      onChange={(e) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          priceRupees: Number(e.target.value) || 0,
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

                  <FormField
                    label="Compare-At Price (INR ₹)"
                    helperText="Strikethrough reference"
                    htmlFor="compare-inr"
                  >
                    <input
                      id="compare-inr"
                      type="number"
                      min="0"
                      value={pricingForm.compareAtRupees}
                      onChange={(e) =>
                        setPricingForm((prev) => ({
                          ...prev,
                          compareAtRupees: Number(e.target.value) || 0,
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
                </div>

                <FormField
                  label="Apple iOS IAP Product ID"
                  helperText="Configured in App Store Connect"
                  htmlFor="ios-iap"
                >
                  <input
                    id="ios-iap"
                    type="text"
                    value={pricingForm.iosIap}
                    onChange={(e) =>
                      setPricingForm((prev) => ({ ...prev, iosIap: e.target.value }))
                    }
                    placeholder="com.sofe.course.fundraising"
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
                  label="Google Android IAP Product ID"
                  helperText="Configured in Google Play Console"
                  htmlFor="android-iap"
                >
                  <input
                    id="android-iap"
                    type="text"
                    value={pricingForm.androidIap}
                    onChange={(e) =>
                      setPricingForm((prev) => ({ ...prev, androidIap: e.target.value }))
                    }
                    placeholder="sofe_course_fundraising"
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
              </>
            )}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px',
                backgroundColor: '#0A233A',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
              }}
            >
              <input
                type="checkbox"
                id="points-toggle"
                checked={pricingForm.redeemableWithPoints}
                onChange={(e) =>
                  setPricingForm((prev) => ({ ...prev, redeemableWithPoints: e.target.checked }))
                }
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: 'var(--color-orange)',
                  cursor: 'pointer',
                }}
              />
              <label htmlFor="points-toggle" style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-white)' }}>
                  Redeemable With Practise Points
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                  Learners can unlock this course using earned gamification points (default 500 pts)
                </div>
              </label>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PUBLISH CHECKLIST */}
        {/* ========================================================= */}
        {activeTab === 'checklist' && (
          <div
            style={{
              backgroundColor: 'var(--color-slate)',
              padding: '28px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              maxWidth: '680px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-white)' }}>
                  Publishing Quality Checklist
                </h2>
                <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginTop: '4px' }}>
                  All 8 requirements must pass before publishing to the mobile store
                </p>
              </div>

              {checklist && (
                <Badge variant={checklist.canPublish ? 'published' : 'draft'}>
                  {checklist.canPublish ? 'READY TO PUBLISH' : 'ACTION REQUIRED'}
                </Badge>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(checklist?.checks || []).map((c) => (
                <div
                  key={c.key}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    backgroundColor: '#0A233A',
                    border: `1px solid ${c.passed ? 'rgba(61, 214, 140, 0.3)' : 'rgba(229, 72, 77, 0.3)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {c.passed ? (
                      <CheckCircle2 size={20} color="var(--color-success)" />
                    ) : (
                      <XCircle size={20} color="var(--color-error)" />
                    )}
                    <div>
                      <div
                        style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-white)' }}
                      >
                        {c.label}
                      </div>
                      {c.details && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: 'var(--color-muted)',
                            marginTop: '2px',
                          }}
                        >
                          {c.details}
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: c.passed ? 'var(--color-success)' : 'var(--color-error)',
                    }}
                  >
                    {c.passed ? 'PASSED' : 'BLOCKED'}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
              {course.status !== 'published' ? (
                <Button variant="primary" disabled={!checklist?.canPublish} onClick={handlePublish}>
                  Publish Course (v{(course.version || 1) + 1})
                </Button>
              ) : (
                <Button variant="outline" onClick={handleUnpublish}>
                  Unpublish to Draft
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Modal: Add Lesson to Curriculum */}
        {isAddLessonModalOpen && (
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
                maxWidth: '440px',
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
                Add Lesson to Section
              </h2>

              <FormField label="Lesson Title" required htmlFor="new-lesson-title">
                <input
                  id="new-lesson-title"
                  type="text"
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  placeholder="e.g. Understanding SAFE Notes & Caps"
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

              <FormField label="Lesson Type" htmlFor="new-lesson-type">
                <select
                  id="new-lesson-type"
                  value={newLessonType}
                  onChange={(e) =>
                    setNewLessonType(e.target.value as 'video' | 'reading' | 'quiz' | 'resource')
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
                  marginTop: '20px',
                }}
              >
                <Button variant="ghost" onClick={() => setIsAddLessonModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleAddLesson}>
                  Add Lesson
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
