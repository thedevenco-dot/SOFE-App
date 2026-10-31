'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  File,
  FileText,
  Copy,
  Check,
  Send,
  RotateCcw,
  Trash2,
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
  Upload,
} from 'lucide-react';
import { AdminShell } from '../../../components/layout/AdminShell';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { FormField } from '../../../components/ui/FormField';
import { adminApiClient } from '../../../lib/api-client';

export interface CategoryOption {
  _id: string;
  name: string;
  slug: string;
}

export function slugify(text: string): string {
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

export default function BookEditorPage() {
  const router = useRouter();
  const params = useParams();
  const bookId = (params?.id as string) || 'new';
  const isNew = bookId === 'new';

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [slugCopied, setSlugCopied] = useState(false);

  const [author, setAuthor] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [descriptionHtml, setDescriptionHtml] = useState('');

  // Format: 'pdf' vs 'summary'
  const [format, setFormat] = useState<'pdf' | 'summary'>('summary');
  const [fileUrl, setFileUrl] = useState('');
  const [summaryHtml, setSummaryHtml] = useState('');

  // Classification & Pricing
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tagsInput, setTagsInput] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [priceInr, setPriceInr] = useState<number>(0);

  // Status
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [publishedAt, setPublishedAt] = useState<string | undefined>(undefined);

  // Editor tab for summary: 'edit' vs 'preview'
  const [editorTab, setEditorTab] = useState<'edit' | 'preview'>('edit');
  const summaryTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Load Categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await adminApiClient.get<{ data: CategoryOption[] }>(
          '/admin/taxonomy/categories',
        );
        setCategories(res.data || []);
      } catch {
        // taxonomy load silent fallback
      }
    }
    loadCategories();
  }, []);

  // Fetch book if editing
  const fetchBook = useCallback(async () => {
    if (isNew) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApiClient.get<Record<string, unknown>>(`/admin/books/${bookId}`);
      const data = res.data ? (res.data as Record<string, unknown>) : res;

      setTitle((data.title as string) || '');
      setSlug((data.slug as string) || '');
      setIsSlugManuallyEdited(true);
      setAuthor((data.author as string) || '');
      setCoverUrl((data.coverUrl as string) || '');
      setDescriptionHtml((data.descriptionHtml as string) || '');

      setFormat((data.format as 'pdf' | 'summary') || 'summary');
      setFileUrl((data.fileUrl as string) || '');

      // Check summary HTML in summaryJson or descriptionHtml
      const sumJson = data.summaryJson as Record<string, unknown> | undefined;
      setSummaryHtml((sumJson?.html as string) || '');

      const cat = data.categoryId as { _id?: string } | string | undefined;
      if (typeof cat === 'object' && cat?._id) {
        setCategoryId(cat._id);
      } else if (typeof cat === 'string') {
        setCategoryId(cat);
      }

      const tagsArr = Array.isArray(data.tags) ? data.tags : [];
      setTagsInput(tagsArr.join(', '));

      setIsFree(data.isFree !== undefined ? Boolean(data.isFree) : true);
      setPriceInr(typeof data.priceInr === 'number' ? data.priceInr : 0);

      setStatus((data.status as 'draft' | 'published' | 'archived') || 'draft');
      setPublishedAt(data.publishedAt as string | undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load book';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [bookId, isNew]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  // Handle title change & auto-slug
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isSlugManuallyEdited) {
      setSlug(slugify(val));
    }
  };

  // Copy slug
  const handleCopySlug = () => {
    if (!slug) return;
    navigator.clipboard.writeText(slug);
    setSlugCopied(true);
    setTimeout(() => setSlugCopied(false), 2000);
  };

  // Format summary toolbar
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = summaryTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = summaryHtml.substring(start, end);
    const replacement = `${prefix}${selectedText || 'text'}${suffix}`;

    const newContent = summaryHtml.substring(0, start) + replacement + summaryHtml.substring(end);
    setSummaryHtml(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText.length || 4),
      );
    }, 0);
  };

  // Save Book
  const handleSave = async (overrideStatus?: 'draft' | 'published') => {
    setError(null);
    setSaveSuccess(null);

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!author.trim()) {
      setError('Author is required');
      return;
    }

    if (!coverUrl.trim()) {
      setError('Cover Image URL is required');
      return;
    }

    if (format === 'pdf' && !fileUrl.trim()) {
      setError('PDF File URL is required when format is PDF');
      return;
    }

    const targetStatus = overrideStatus || status;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload = {
      title: title.trim(),
      slug: slug.trim() ? slugify(slug) : slugify(title),
      author: author.trim(),
      coverUrl: coverUrl.trim(),
      descriptionHtml: descriptionHtml.trim(),
      format,
      fileUrl: format === 'pdf' ? fileUrl.trim() : undefined,
      summaryJson: format === 'summary' ? { html: summaryHtml } : undefined,
      categoryId: categoryId || undefined,
      tags,
      isFree,
      priceInr: isFree ? 0 : Math.max(0, Number(priceInr) || 0),
      status: targetStatus,
    };

    setIsSaving(true);
    try {
      if (isNew) {
        const res = await adminApiClient.post<Record<string, unknown>>('/admin/books', payload);
        const createdId = (res._id || res.id) as string;
        setSaveSuccess('Book created successfully');
        setTimeout(() => {
          router.replace(`/books/${createdId}`);
        }, 800);
      } else {
        await adminApiClient.put(`/admin/books/${bookId}`, payload);
        setStatus(targetStatus);
        setSaveSuccess('Book saved successfully');
        fetchBook();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save book';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // Publish / Unpublish
  const handlePublish = async () => {
    await handleSave('published');
  };

  const handleUnpublish = async () => {
    if (isNew) return;
    try {
      await adminApiClient.post(`/admin/books/${bookId}/unpublish`, {});
      setStatus('draft');
      setSaveSuccess('Book reverted to draft');
      fetchBook();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to unpublish';
      setError(msg);
    }
  };

  // Delete Book
  const handleDelete = async () => {
    if (isNew) return;
    if (!window.confirm('Are you sure you want to delete this book? This cannot be undone.'))
      return;

    try {
      await adminApiClient.delete(`/admin/books/${bookId}`);
      router.replace('/books');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete book';
      setError(msg);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/books')}
              className="h-9 px-2 text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Books
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  {isNew ? 'New Book (CS11)' : title || 'Edit Book (CS11)'}
                </h1>
                <Badge
                  variant={
                    status === 'published'
                      ? 'published'
                      : status === 'archived'
                        ? 'archived'
                        : 'draft'
                  }
                >
                  {status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isNew ? 'Create a summary or PDF book.' : `ID: ${bookId}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isNew && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-slate-500 hover:text-rose-400 h-9"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Delete
              </Button>
            )}

            {!isNew && status === 'published' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleUnpublish}
                disabled={isSaving}
                className="text-amber-400 hover:text-amber-300 h-9"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" />
                Unpublish
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleSave('draft')}
                disabled={isSaving}
                className="h-9"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Save Draft
              </Button>
            )}

            <Button
              size="sm"
              onClick={handlePublish}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium h-9"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Publish
            </Button>
          </div>
        </div>

        {/* Notices */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}

        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div className="text-sm font-medium">{saveSuccess}</div>
          </div>
        )}

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">Loading book details...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Content (Left - 8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Title & Slug */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <FormField label="Book Title" required>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="e.g. Zero to One: Notes on Startups"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </FormField>

                <FormField
                  label="URL Slug"
                  helperText="Unique slug identifier used in URLs (/learn/book/[slug])."
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">/learn/book/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        setIsSlugManuallyEdited(true);
                        setSlug(slugify(e.target.value));
                      }}
                      placeholder="zero-to-one"
                      className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-300 font-mono focus:outline-none focus:border-orange-500"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopySlug}
                      className="h-8 px-2 text-xs text-slate-400 hover:text-white"
                      title="Copy Slug"
                    >
                      {slugCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </FormField>

                <FormField label="Author" required>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g. Peter Thiel with Blake Masters"
                    className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </FormField>
              </div>

              {/* Format Switcher */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <FormField
                  label="Book Format"
                  required
                  helperText="Choose whether learners read an interactive summary or open a downloadable PDF."
                >
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormat('summary')}
                      className={`p-4 rounded-xl border flex items-center gap-3 text-left transition-all ${
                        format === 'summary'
                          ? 'bg-purple-500/10 border-purple-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${format === 'summary' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                      >
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Interactive Summary</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Rich formatted reading canvas in mobile app
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormat('pdf')}
                      className={`p-4 rounded-xl border flex items-center gap-3 text-left transition-all ${
                        format === 'pdf'
                          ? 'bg-blue-500/10 border-blue-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg ${format === 'pdf' ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                      >
                        <File className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Downloadable PDF</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          Secure direct PDF file link
                        </div>
                      </div>
                    </button>
                  </div>
                </FormField>

                {/* PDF Specific Fields */}
                {format === 'pdf' && (
                  <div className="pt-2 space-y-3">
                    <FormField
                      label="PDF File URL"
                      required
                      helperText="Direct secure HTTPS URL to the PDF document."
                    >
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={fileUrl}
                          onChange={(e) => setFileUrl(e.target.value)}
                          placeholder="https://res.cloudinary.com/.../book.pdf"
                          className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            const demo =
                              'https://res.cloudinary.com/sofe-demo/raw/upload/v1/books/sample-book.pdf';
                            setFileUrl(demo);
                          }}
                          className="text-xs whitespace-nowrap"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1.5" />
                          Set Sample
                        </Button>
                      </div>
                    </FormField>
                  </div>
                )}

                {/* Summary Rich Text Fields */}
                {format === 'summary' && (
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-200">
                        Summary Content (HTML)
                      </label>
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setEditorTab('edit')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            editorTab === 'edit'
                              ? 'bg-slate-800 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Editor
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditorTab('preview')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                            editorTab === 'preview'
                              ? 'bg-slate-800 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          Live Preview
                        </button>
                      </div>
                    </div>

                    {editorTab === 'edit' ? (
                      <div className="space-y-2">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-950 rounded-lg border border-slate-800 text-slate-300">
                          <button
                            type="button"
                            onClick={() => insertFormatting('<h2>', '</h2>')}
                            className="p-1.5 rounded hover:bg-slate-800"
                            title="Heading 2"
                          >
                            <Heading2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('<h3>', '</h3>')}
                            className="p-1.5 rounded hover:bg-slate-800"
                            title="Heading 3"
                          >
                            <Heading3 className="w-4 h-4" />
                          </button>
                          <div className="w-px h-4 bg-slate-800 mx-1" />
                          <button
                            type="button"
                            onClick={() => insertFormatting('<strong>', '</strong>')}
                            className="p-1.5 rounded hover:bg-slate-800 font-bold"
                            title="Bold"
                          >
                            <Bold className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('<em>', '</em>')}
                            className="p-1.5 rounded hover:bg-slate-800 italic"
                            title="Italic"
                          >
                            <Italic className="w-4 h-4" />
                          </button>
                          <div className="w-px h-4 bg-slate-800 mx-1" />
                          <button
                            type="button"
                            onClick={() => insertFormatting('<ul>\n  <li>', '</li>\n</ul>')}
                            className="p-1.5 rounded hover:bg-slate-800"
                            title="Bullet List"
                          >
                            <List className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('<ol>\n  <li>', '</li>\n</ol>')}
                            className="p-1.5 rounded hover:bg-slate-800"
                            title="Numbered List"
                          >
                            <ListOrdered className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('<blockquote>', '</blockquote>')}
                            className="p-1.5 rounded hover:bg-slate-800"
                            title="Quote"
                          >
                            <Quote className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('<code>', '</code>')}
                            className="p-1.5 rounded hover:bg-slate-800"
                            title="Inline Code"
                          >
                            <Code className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('<a href="https://...">', '</a>')}
                            className="p-1.5 rounded hover:bg-slate-800"
                            title="Link"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => insertFormatting('<hr />\n')}
                            className="p-1.5 rounded hover:bg-slate-800"
                            title="Divider"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>

                        <textarea
                          ref={summaryTextareaRef}
                          value={summaryHtml}
                          onChange={(e) => setSummaryHtml(e.target.value)}
                          placeholder="Write book key takeaways, frameworks, and chapter summaries in HTML..."
                          rows={14}
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono leading-relaxed focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    ) : (
                      <div className="p-6 rounded-lg bg-slate-950 border border-slate-800 min-h-[350px] max-h-[500px] overflow-y-auto prose prose-invert max-w-none text-slate-300">
                        {summaryHtml ? (
                          <div dangerouslySetInnerHTML={{ __html: summaryHtml }} />
                        ) : (
                          <div className="text-slate-500 italic text-sm">
                            No summary content to preview yet.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Book Description / Synopsis */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <FormField
                  label="Description / Synopsis"
                  helperText="Brief overview of the book shown on detail cards and discovery feeds."
                >
                  <textarea
                    value={descriptionHtml}
                    onChange={(e) => setDescriptionHtml(e.target.value)}
                    placeholder="Provide an engaging book summary overview..."
                    rows={4}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </FormField>
              </div>
            </div>

            {/* Sidebar Settings (Right - 4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Cover Image */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-white">Cover Image</h3>
                <FormField label="Image URL" required>
                  <input
                    type="url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://images.example.com/cover.jpg"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </FormField>

                <div className="w-full aspect-[3/4] max-w-[180px] mx-auto rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center relative shadow-md">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <span className="text-xs text-slate-500">Cover Preview</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Classification & Pricing */}
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <h3 className="text-sm font-semibold text-white">Classification & Access</h3>

                <FormField label="Category">
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Tags"
                  helperText="Comma-separated topics (e.g. startup, leadership, mvp)"
                >
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="fundraising, product, scale"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </FormField>

                {/* Free vs Paid Toggle */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">Free Access</div>
                      <div className="text-xs text-slate-400">
                        Available to all registered learners
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isFree}
                      onChange={(e) => setIsFree(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-orange-500 focus:ring-orange-500/20"
                    />
                  </div>

                  {!isFree && (
                    <FormField label="Price in INR (₹)" required>
                      <input
                        type="number"
                        min="0"
                        value={priceInr}
                        onChange={(e) => setPriceInr(Number(e.target.value))}
                        placeholder="299"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </FormField>
                  )}
                </div>
              </div>

              {/* Metadata Card */}
              {!isNew && (
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-slate-200 capitalize font-medium">{status}</span>
                  </div>
                  {publishedAt && (
                    <div className="flex justify-between">
                      <span>Published:</span>
                      <span className="text-slate-200 font-medium">
                        {new Date(publishedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
