'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calendar,
  Smartphone,
  Copy,
  Check,
  Star,
  Send,
  RotateCcw,
  X,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Minus,
} from 'lucide-react';
import { AdminShell } from '../../../components/layout/AdminShell';
import { Button } from '../../../components/ui/Button';
import { Badge, BadgeVariant } from '../../../components/ui/Badge';
import { FormField } from '../../../components/ui/FormField';
import { adminApiClient } from '../../../lib/api-client';

export interface TopicOption {
  _id: string;
  name: string;
  slug: string;
}

export interface AuthorOption {
  _id: string;
  name: string;
  avatarUrl?: string;
  title?: string;
  bio?: string;
}

export interface ArticleFullData {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  bodyHtml: string;
  coverUrl: string;
  coverAlt?: string;
  primaryTopicId?: { _id: string; name: string; slug: string } | string;
  topicIds?: Array<{ _id: string; name: string } | string>;
  tags: string[];
  authorId?: { _id: string; name: string; avatarUrl?: string; title?: string } | string;
  readTimeMin: number;
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  scheduledAt?: string;
  publishedAt?: string;
  featured: boolean;
  version?: number;
  seo?: {
    title?: string;
    description?: string;
  };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sanitizeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(["'])?[^"'>]+(\1)?/gi, '')
    .replace(/javascript:[^"'>]+/gi, '')
    .trim();
}

function calculateReadTime(html: string): number {
  if (!html) return 1;
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = text ? text.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
}

export default function ArticleEditorPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = (params?.id as string) || '';
  const isNew = articleId === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState(false);

  // Available metadata
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [authors, setAuthors] = useState<AuthorOption[]>([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [coverAlt, setCoverAlt] = useState('');
  const [primaryTopicId, setPrimaryTopicId] = useState('');
  const [secondaryTopicIds, setSecondaryTopicIds] = useState<string[]>([]);
  const [authorId, setAuthorId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [readTimeMin, setReadTimeMin] = useState(5);
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled' | 'archived'>('draft');
  const [version, setVersion] = useState(1);
  const [publishedAt, setPublishedAt] = useState<string | undefined>();
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // UI Tabs & Modals
  const [bodyTab, setBodyTab] = useState<'editor' | 'preview'>('editor');
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduledDateStr, setScheduledDateStr] = useState('');

  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch Topics and Authors
  useEffect(() => {
    const fetchMetadata = async () => {
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
    fetchMetadata();
  }, []);

  // Fetch Existing Article
  const fetchArticle = useCallback(async () => {
    if (isNew || !articleId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.get<ArticleFullData>(`/admin/articles/${articleId}`);
      setTitle(data.title || '');
      setSlug(data.slug || '');
      setExcerpt(data.excerpt || '');
      setBodyHtml(data.bodyHtml || '');
      setCoverUrl(data.coverUrl || '');
      setCoverAlt(data.coverAlt || '');
      setFeatured(Boolean(data.featured));
      setStatus(data.status || 'draft');
      setReadTimeMin(data.readTimeMin || 5);
      setVersion(data.version || 1);
      setPublishedAt(data.publishedAt);
      setTagsInput((data.tags || []).join(', '));

      // Primary topic
      const pId =
        typeof data.primaryTopicId === 'object' ? data.primaryTopicId?._id : data.primaryTopicId;
      setPrimaryTopicId(pId || '');

      // Secondary topics
      const secIds = (data.topicIds || []).map((t) => (typeof t === 'object' ? t._id : t));
      setSecondaryTopicIds(secIds);

      // Author
      const aId = typeof data.authorId === 'object' ? data.authorId?._id : data.authorId;
      setAuthorId(aId || '');

      // SEO
      if (data.seo) {
        setSeoTitle(data.seo.title || '');
        setSeoDescription(data.seo.description || '');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load article');
    } finally {
      setIsLoading(false);
    }
  }, [articleId, isNew]);

  useEffect(() => {
    fetchArticle();
  }, [fetchArticle]);

  // Auto-slugify when title changes on new article
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isNew || !slug) {
      setSlug(slugify(val));
    }
  };

  // Auto-update read time when body changes
  const handleBodyChange = (val: string) => {
    setBodyHtml(val);
    const calculated = calculateReadTime(val);
    setReadTimeMin(calculated);
  };

  // Rich Text Formatting Actions for Textarea
  const applyFormat = (prefix: string, suffix = '') => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = bodyHtml.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newHtml = bodyHtml.substring(0, start) + replacement + bodyHtml.substring(end);
    handleBodyChange(newHtml);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText.length || 4),
      );
    }, 10);
  };

  // Copy Slug
  const handleCopySlug = () => {
    if (!slug) return;
    navigator.clipboard.writeText(`/startup-world/${slug}`);
    setCopiedSlug(true);
    setTimeout(() => setCopiedSlug(false), 2000);
  };

  // Build Payload
  const getPayload = () => {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    return {
      title: title.trim(),
      slug: slug.trim() ? slugify(slug) : slugify(title),
      excerpt: excerpt.trim(),
      bodyHtml: sanitizeHtml(bodyHtml),
      coverUrl: coverUrl.trim(),
      coverAlt: coverAlt.trim(),
      primaryTopicId: primaryTopicId || undefined,
      topicIds: secondaryTopicIds,
      tags,
      authorId: authorId || undefined,
      readTimeMin,
      featured,
      seo: {
        title: seoTitle.trim() || undefined,
        description: seoDescription.trim() || undefined,
      },
    };
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!title.trim()) {
      setError('Article title is required');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const payload = getPayload();

      if (isNew) {
        const created = await adminApiClient.post<ArticleFullData>('/admin/articles', {
          ...payload,
          status: 'draft',
        });
        const targetId = created.id || created._id;
        router.replace(`/articles/${targetId}`);
      } else {
        const updated = await adminApiClient.put<ArticleFullData>(
          `/admin/articles/${articleId}`,
          payload,
        );
        setTitle(updated.title);
        setSlug(updated.slug);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setIsSaving(false);
    }
  };

  // Publish
  const handlePublish = async () => {
    if (!primaryTopicId) {
      setError('Please assign a Primary Topic before publishing');
      return;
    }
    if (!authorId) {
      setError('Please assign an Author before publishing');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // If new, create first
      let currentId = articleId;
      const payload = getPayload();

      if (isNew) {
        const created = await adminApiClient.post<ArticleFullData>('/admin/articles', payload);
        currentId = created.id || created._id;
      } else {
        await adminApiClient.put(`/admin/articles/${currentId}`, payload);
      }

      const published = await adminApiClient.post<ArticleFullData>(
        `/admin/articles/${currentId}/publish`,
      );
      setStatus('published');
      setPublishedAt(published.publishedAt);
      setVersion(published.version || version + 1);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      if (isNew) {
        router.replace(`/articles/${currentId}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Unpublish
  const handleUnpublish = async () => {
    if (!confirm('Revert article status back to Draft?')) return;
    setIsSaving(true);
    try {
      await adminApiClient.post(`/admin/articles/${articleId}/unpublish`);
      setStatus('draft');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unpublish failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Schedule Publish
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledDateStr) return;

    setIsSaving(true);
    setError(null);
    try {
      if (isNew) {
        await handleSaveDraft();
      }
      await adminApiClient.post(`/admin/articles/${articleId}/schedule`, {
        scheduledAt: new Date(scheduledDateStr).toISOString(),
      });
      setStatus('scheduled');
      setIsScheduleModalOpen(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to schedule article');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminShell>
        <div style={{ color: 'var(--color-muted)', padding: '40px', textAlign: 'center' }}>
          Loading Article Editor...
        </div>
      </AdminShell>
    );
  }

  const selectedPrimaryTopic = topics.find((t) => t._id === primaryTopicId);
  const selectedAuthor = authors.find((a) => a._id === authorId);

  return (
    <AdminShell>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Top Action Header */}
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
              onClick={() => router.push('/articles')}
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
                    fontSize: '20px',
                    fontWeight: 800,
                    color: 'var(--color-white)',
                    fontFamily: 'var(--font-heading)',
                  }}
                >
                  {title ? title : isNew ? 'New Article' : 'Untitled Article'}
                </h1>
                <Badge variant={status as BadgeVariant}>{status.toUpperCase()}</Badge>
                {!isNew && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      backgroundColor: '#0F273D',
                      borderRadius: '4px',
                      color: 'var(--color-orange)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    v{version}
                  </span>
                )}
                {featured && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: 'var(--color-orange)',
                      fontWeight: 600,
                    }}
                  >
                    <Star size={12} fill="var(--color-orange)" /> Hero Featured
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '2px' }}>
                {status === 'published' && publishedAt
                  ? `Published on ${new Date(publishedAt).toLocaleDateString()}`
                  : 'Draft in progress'}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {saveSuccess && (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--color-success)',
                  fontSize: '13px',
                }}
              >
                <CheckCircle2 size={16} /> Saved
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobilePreviewOpen(true)}
              title="Preview on mobile screen"
            >
              <Smartphone size={15} /> Mobile Preview
            </Button>

            <Button variant="outline" size="sm" disabled={isSaving} onClick={handleSaveDraft}>
              <Save size={15} /> Save Draft
            </Button>

            {!isNew && status !== 'published' && (
              <Button variant="outline" size="sm" onClick={() => setIsScheduleModalOpen(true)}>
                <Calendar size={15} /> Schedule
              </Button>
            )}

            {status !== 'published' ? (
              <Button variant="primary" size="sm" disabled={isSaving} onClick={handlePublish}>
                <Send size={15} /> Publish Now
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleUnpublish}>
                <RotateCcw size={15} /> Unpublish
              </Button>
            )}
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

        {/* Two-Column Editor Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1fr)',
            gap: '24px',
            alignItems: 'flex-start',
          }}
        >
          {/* LEFT: Main Editorial Canvas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Title & Slug Box */}
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
              <FormField label="Article Headline / Title" required htmlFor="article-title">
                <input
                  id="article-title"
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. The Anatomy of an Angel Syndicate: Due Diligence, SPVs, and Carried Interest"
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#0A233A',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-white)',
                    fontSize: '16px',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </FormField>

              {/* Slug */}
              <FormField
                label="URL Slug"
                htmlFor="article-slug"
                helperText="Lowercase, hyphen-separated unique URL key"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      flex: 1,
                      backgroundColor: '#0A233A',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      overflow: 'hidden',
                    }}
                  >
                    <span
                      style={{
                        padding: '10px 12px',
                        backgroundColor: '#061E30',
                        fontSize: '12px',
                        color: 'var(--color-muted)',
                        borderRight: '1px solid var(--color-border)',
                      }}
                    >
                      /startup-world/
                    </span>
                    <input
                      id="article-slug"
                      type="text"
                      value={slug}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--color-white)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={handleCopySlug}
                    title="Copy full URL slug"
                  >
                    {copiedSlug ? (
                      <Check size={14} color="var(--color-success)" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </Button>
                </div>
              </FormField>

              {/* Excerpt */}
              <FormField
                label={`Article Excerpt (${excerpt.length}/200 chars)`}
                required
                htmlFor="article-excerpt"
                helperText="Short synopsis shown on mobile feed cards and search results"
              >
                <textarea
                  id="article-excerpt"
                  rows={3}
                  maxLength={200}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Summarize the core takeaways in 2-3 compelling sentences..."
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#0A233A',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-white)',
                    fontSize: '13px',
                    outline: 'none',
                    lineHeight: '1.4',
                  }}
                />
              </FormField>
            </div>

            {/* Rich Body HTML Canvas */}
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
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-white)' }}>
                    Article Body
                  </h2>
                  <span style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                    Estimated Read Time: {readTimeMin} min (
                    {
                      bodyHtml
                        .replace(/<[^>]*>/g, '')
                        .trim()
                        .split(/\s+/)
                        .filter(Boolean).length
                    }{' '}
                    words)
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant={bodyTab === 'editor' ? 'primary' : 'outline'}
                    size="sm"
                    type="button"
                    onClick={() => setBodyTab('editor')}
                  >
                    HTML Canvas
                  </Button>
                  <Button
                    variant={bodyTab === 'preview' ? 'primary' : 'outline'}
                    size="sm"
                    type="button"
                    onClick={() => setBodyTab('preview')}
                  >
                    <Eye size={14} /> Live Preview
                  </Button>
                </div>
              </div>

              {bodyTab === 'editor' ? (
                <>
                  {/* Formatting Toolbar */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px',
                      padding: '8px',
                      backgroundColor: '#0A233A',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => applyFormat('<h2>', '</h2>')}
                      title="Heading 2"
                      style={toolbarBtnStyle}
                    >
                      <Heading2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('<h3>', '</h3>')}
                      title="Heading 3"
                      style={toolbarBtnStyle}
                    >
                      <Heading3 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('<strong>', '</strong>')}
                      title="Bold"
                      style={toolbarBtnStyle}
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('<em>', '</em>')}
                      title="Italic"
                      style={toolbarBtnStyle}
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('<p>', '</p>')}
                      title="Paragraph"
                      style={toolbarBtnStyle}
                    >
                      P
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('<ul>\n  <li>', '</li>\n</ul>')}
                      title="Bullet List"
                      style={toolbarBtnStyle}
                    >
                      <List size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('<ol>\n  <li>', '</li>\n</ol>')}
                      title="Numbered List"
                      style={toolbarBtnStyle}
                    >
                      <ListOrdered size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('<blockquote>', '</blockquote>')}
                      title="Blockquote"
                      style={toolbarBtnStyle}
                    >
                      <Quote size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('<pre><code>', '</code></pre>')}
                      title="Code Block"
                      style={toolbarBtnStyle}
                    >
                      <Code size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Enter link URL:', 'https://');
                        if (url)
                          applyFormat(
                            `<a href="${url}" target="_blank" rel="noopener noreferrer">`,
                            '</a>',
                          );
                      }}
                      title="Hyperlink"
                      style={toolbarBtnStyle}
                    >
                      <LinkIcon size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormat('<hr />\n')}
                      title="Divider"
                      style={toolbarBtnStyle}
                    >
                      <Minus size={16} />
                    </button>
                  </div>

                  <FormField label="Formatted Body Content" required htmlFor="article-body-html">
                    <textarea
                      ref={bodyTextareaRef}
                      id="article-body-html"
                      rows={20}
                      value={bodyHtml}
                      onChange={(e) => handleBodyChange(e.target.value)}
                      placeholder="<h2>Introduction</h2><p>Begin writing the article here...</p>"
                      style={{
                        padding: '14px',
                        backgroundColor: '#0A233A',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: 'var(--color-white)',
                        fontSize: '14px',
                        fontFamily: 'monospace',
                        outline: 'none',
                        lineHeight: '1.6',
                      }}
                    />
                  </FormField>
                </>
              ) : (
                <div
                  style={{
                    padding: '24px',
                    backgroundColor: '#0A233A',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    minHeight: '400px',
                    color: 'var(--color-white)',
                    lineHeight: '1.7',
                    fontSize: '15px',
                  }}
                  dangerouslySetInnerHTML={{
                    __html:
                      sanitizeHtml(bodyHtml) ||
                      '<p style="color: var(--color-muted);">No content written yet.</p>',
                  }}
                />
              )}
            </div>
          </div>

          {/* RIGHT: Metadata & Configuration Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Cover Image */}
            <div
              style={{
                backgroundColor: 'var(--color-slate)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-white)' }}>
                Cover Media (16:9)
              </h3>

              {coverUrl ? (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/9',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#061E30',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <img
                    src={coverUrl}
                    alt={coverAlt || title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    borderRadius: '8px',
                    border: '2px dashed var(--color-border)',
                    backgroundColor: '#0A233A',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-muted)',
                    fontSize: '12px',
                  }}
                >
                  No cover image preview
                </div>
              )}

              <FormField label="Cover Image URL" htmlFor="cover-url">
                <input
                  id="cover-url"
                  type="url"
                  value={coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  style={inputStyle}
                />
              </FormField>

              <FormField
                label="Alt Text"
                htmlFor="cover-alt"
                helperText="Description for screen readers and SEO"
              >
                <input
                  id="cover-alt"
                  type="text"
                  value={coverAlt}
                  onChange={(e) => setCoverAlt(e.target.value)}
                  placeholder="e.g. Founders signing seed round termsheet"
                  style={inputStyle}
                />
              </FormField>
            </div>

            {/* Classification: Topic & Author */}
            <div
              style={{
                backgroundColor: 'var(--color-slate)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-white)' }}>
                Classification & Author
              </h3>

              <FormField label="Primary Topic (Required)" required htmlFor="primary-topic">
                <select
                  id="primary-topic"
                  value={primaryTopicId}
                  onChange={(e) => setPrimaryTopicId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select Topic</option>
                  {topics.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Secondary Topics */}
              <div>
                <label style={labelStyle}>Additional Topics (Multi-select)</label>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    maxHeight: '120px',
                    overflowY: 'auto',
                    backgroundColor: '#0A233A',
                    padding: '8px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {topics
                    .filter((t) => t._id !== primaryTopicId)
                    .map((t) => {
                      const isSelected = secondaryTopicIds.includes(t._id);
                      return (
                        <button
                          key={t._id}
                          type="button"
                          onClick={() => {
                            setSecondaryTopicIds((prev) =>
                              isSelected ? prev.filter((id) => id !== t._id) : [...prev, t._id],
                            );
                          }}
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: `1px solid ${isSelected ? 'var(--color-orange)' : 'var(--color-border)'}`,
                            backgroundColor: isSelected
                              ? 'rgba(255, 132, 41, 0.15)'
                              : 'transparent',
                            color: isSelected ? 'var(--color-orange)' : 'var(--color-muted)',
                          }}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Author */}
              <FormField label="Author (Required)" required htmlFor="article-author">
                <select
                  id="article-author"
                  value={authorId}
                  onChange={(e) => setAuthorId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select Author</option>
                  {authors.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.name} {a.title ? `(${a.title})` : ''}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Tags */}
              <FormField
                label="Tags"
                htmlFor="article-tags"
                helperText="Comma separated (e.g. seed, term-sheets, india)"
              >
                <input
                  id="article-tags"
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="fundraising, term-sheets, legal"
                  style={inputStyle}
                />
              </FormField>
            </div>

            {/* Editorial Options & SEO */}
            <div
              style={{
                backgroundColor: 'var(--color-slate)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-white)' }}>
                Editorial Settings & SEO
              </h3>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  color: 'var(--color-white)',
                  fontSize: '13px',
                }}
              >
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--color-orange)' }}
                />
                <span>
                  <strong>Featured Hero Story</strong> (Pinned in Startup World feed)
                </span>
              </label>

              <FormField label="Read Time (Minutes)" htmlFor="read-time-min">
                <input
                  id="read-time-min"
                  type="number"
                  min="1"
                  value={readTimeMin}
                  onChange={(e) => setReadTimeMin(Math.max(1, Number(e.target.value) || 1))}
                  style={inputStyle}
                />
              </FormField>

              <FormField label="SEO Meta Title" htmlFor="seo-title">
                <input
                  id="seo-title"
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Search engine optimized headline..."
                  style={inputStyle}
                />
              </FormField>

              <FormField label="SEO Meta Description" htmlFor="seo-desc">
                <textarea
                  id="seo-desc"
                  rows={2}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Summary for Google and link cards..."
                  style={inputStyle}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Modal: Schedule Publication */}
        {isScheduleModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.75)',
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
                Schedule Article Release
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '16px' }}>
                Select the target date and time (IST) when this article will go live in the mobile
                feed.
              </p>

              <form
                onSubmit={handleScheduleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <FormField label="Publish Date & Time" required htmlFor="schedule-datetime">
                  <input
                    id="schedule-datetime"
                    type="datetime-local"
                    value={scheduledDateStr}
                    onChange={(e) => setScheduledDateStr(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </FormField>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsScheduleModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSaving}>
                    Confirm Schedule
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Mobile Reader Frame Preview */}
        {isMobilePreviewOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px',
            }}
          >
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setIsMobilePreviewOpen(false)}
                style={{
                  position: 'absolute',
                  top: '-36px',
                  right: 0,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-white)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                }}
              >
                <X size={18} /> Close Preview
              </button>

              {/* Mobile Phone Mockup Device */}
              <div
                style={{
                  width: '375px',
                  height: '680px',
                  backgroundColor: '#061E30',
                  borderRadius: '36px',
                  border: '8px solid #142D42',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Notch */}
                <div
                  style={{
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#061E30',
                  }}
                >
                  <div
                    style={{
                      width: '80px',
                      height: '14px',
                      backgroundColor: '#142D42',
                      borderRadius: '10px',
                    }}
                  />
                </div>

                {/* Mobile Top Navigation */}
                <div
                  style={{
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-orange)' }}>
                    STARTUP WORLD
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                    {readTimeMin} min read
                  </span>
                </div>

                {/* Mobile Article Reader Content */}
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    color: 'var(--color-white)',
                  }}
                >
                  {/* Topic badge */}
                  {selectedPrimaryTopic && (
                    <span
                      style={{
                        alignSelf: 'flex-start',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: '#0A233A',
                        color: 'var(--color-orange)',
                      }}
                    >
                      {selectedPrimaryTopic.name}
                    </span>
                  )}

                  {/* Title */}
                  <h1 style={{ fontSize: '18px', fontWeight: 800, lineHeight: '1.3' }}>
                    {title || 'Article Headline'}
                  </h1>

                  {/* Author Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {selectedAuthor?.avatarUrl ? (
                      <img
                        src={selectedAuthor.avatarUrl}
                        alt={selectedAuthor.name}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: '#1E3A5F',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                        }}
                      >
                        {selectedAuthor?.name?.charAt(0) || 'A'}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>
                        {selectedAuthor?.name || 'Author Name'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-muted)' }}>
                        {selectedAuthor?.title || 'Contributor'}
                      </div>
                    </div>
                  </div>

                  {/* Cover */}
                  {coverUrl && (
                    <div
                      style={{
                        width: '100%',
                        aspectRatio: '16/9',
                        borderRadius: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={coverUrl}
                        alt="Cover"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                  )}

                  {/* Excerpt callout */}
                  {excerpt && (
                    <div
                      style={{
                        padding: '10px',
                        backgroundColor: '#0A233A',
                        borderRadius: '6px',
                        borderLeft: '3px solid var(--color-orange)',
                        fontSize: '12px',
                        fontStyle: 'italic',
                        color: 'var(--color-muted)',
                      }}
                    >
                      {excerpt}
                    </div>
                  )}

                  {/* Rendered Body */}
                  <div
                    style={{ fontSize: '13px', lineHeight: '1.6', marginTop: '6px' }}
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(bodyHtml) || '<p>Article body will appear here...</p>',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

const toolbarBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--color-muted)',
  cursor: 'pointer',
  padding: '6px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  backgroundColor: '#0A233A',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  color: 'var(--color-white)',
  fontSize: '13px',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--color-white)',
  marginBottom: '6px',
  display: 'block',
};
