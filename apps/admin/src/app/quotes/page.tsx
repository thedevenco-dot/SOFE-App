'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Quote as QuoteIcon,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  Save,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FormField } from '../../components/ui/FormField';
import { adminApiClient } from '../../lib/api-client';

interface QuoteItem {
  id: string;
  text: string;
  author?: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
}

interface WordItem {
  id: string;
  word: string;
  meaning?: string;
  status: 'draft' | 'published' | 'archived';
}

interface PromptItem {
  id: string;
  prompt: string;
  category?: string;
  active: boolean;
  order: number;
}

export default function QuotesPromptsLibraryPage() {
  const [activeTab, setActiveTab] = useState<'quotes' | 'words' | 'prompts'>('quotes');
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [words, setWords] = useState<WordItem[]>([]);
  const [prompts, setPrompts] = useState<PromptItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modals
  const [editingQuote, setEditingQuote] = useState<Partial<QuoteItem> | null>(null);
  const [editingWord, setEditingWord] = useState<Partial<WordItem> | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<Partial<PromptItem> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'quotes') {
        const data = await adminApiClient.request<QuoteItem[]>('/admin/quotes-prompts/quotes');
        setQuotes(data || []);
      } else if (activeTab === 'words') {
        const data = await adminApiClient.request<WordItem[]>('/admin/quotes-prompts/words');
        setWords(data || []);
      } else {
        const data = await adminApiClient.request<PromptItem[]>('/admin/quotes-prompts/prompts');
        setPrompts(data || []);
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Quote Save & Delete
  const handleSaveQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuote) return;
    setIsSubmitting(true);
    try {
      if (editingQuote.id) {
        await adminApiClient.request(`/admin/quotes-prompts/quotes/${editingQuote.id}`, {
          method: 'PATCH',
          body: JSON.stringify(editingQuote),
        });
        setSuccess('Quote updated!');
      } else {
        await adminApiClient.request('/admin/quotes-prompts/quotes', {
          method: 'POST',
          body: JSON.stringify(editingQuote),
        });
        setSuccess('Quote created!');
      }
      setEditingQuote(null);
      fetchItems();
    } catch (err) {
      setError((err as Error).message || 'Failed to save quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) return;
    try {
      await adminApiClient.request(`/admin/quotes-prompts/quotes/${id}`, { method: 'DELETE' });
      setQuotes((prev) => prev.filter((q) => q.id !== id));
      setSuccess('Quote deleted');
    } catch (err) {
      setError((err as Error).message || 'Failed to delete');
    }
  };

  // Word Save & Delete
  const handleSaveWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWord) return;
    setIsSubmitting(true);
    try {
      if (editingWord.id) {
        await adminApiClient.request(`/admin/quotes-prompts/words/${editingWord.id}`, {
          method: 'PATCH',
          body: JSON.stringify(editingWord),
        });
        setSuccess('Word updated!');
      } else {
        await adminApiClient.request('/admin/quotes-prompts/words', {
          method: 'POST',
          body: JSON.stringify(editingWord),
        });
        setSuccess('Word created!');
      }
      setEditingWord(null);
      fetchItems();
    } catch (err) {
      setError((err as Error).message || 'Failed to save word');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this word?')) return;
    try {
      await adminApiClient.request(`/admin/quotes-prompts/words/${id}`, { method: 'DELETE' });
      setWords((prev) => prev.filter((w) => w.id !== id));
      setSuccess('Word deleted');
    } catch (err) {
      setError((err as Error).message || 'Failed to delete');
    }
  };

  // Prompt Save & Delete
  const handleSavePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt) return;
    setIsSubmitting(true);
    try {
      if (editingPrompt.id) {
        await adminApiClient.request(`/admin/quotes-prompts/prompts/${editingPrompt.id}`, {
          method: 'PATCH',
          body: JSON.stringify(editingPrompt),
        });
        setSuccess('Prompt updated!');
      } else {
        await adminApiClient.request('/admin/quotes-prompts/prompts', {
          method: 'POST',
          body: JSON.stringify(editingPrompt),
        });
        setSuccess('Prompt created!');
      }
      setEditingPrompt(null);
      fetchItems();
    } catch (err) {
      setError((err as Error).message || 'Failed to save prompt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    try {
      await adminApiClient.request(`/admin/quotes-prompts/prompts/${id}`, { method: 'DELETE' });
      setPrompts((prev) => prev.filter((p) => p.id !== id));
      setSuccess('Prompt deleted');
    } catch (err) {
      setError((err as Error).message || 'Failed to delete');
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <QuoteIcon className="w-6 h-6 text-primary-600" />
              Quotes, Words & Prompts Library (CS26)
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Curate founder inspiration: Daily Quotes, Words of the Day, and Executive Reflection
              Prompts.
            </p>
          </div>
          <div>
            {activeTab === 'quotes' && (
              <Button
                variant="primary"
                onClick={() => setEditingQuote({ text: '', author: '', status: 'published' })}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Quote
              </Button>
            )}
            {activeTab === 'words' && (
              <Button
                variant="primary"
                onClick={() => setEditingWord({ word: '', meaning: '', status: 'published' })}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Word
              </Button>
            )}
            {activeTab === 'prompts' && (
              <Button
                variant="primary"
                onClick={() => setEditingPrompt({ prompt: '', active: true, order: 0 })}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Prompt
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2 text-sm border border-green-200">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 gap-4">
          <button
            onClick={() => setActiveTab('quotes')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'quotes'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <QuoteIcon className="w-4 h-4" /> Daily Quotes
          </button>
          <button
            onClick={() => setActiveTab('words')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'words'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Words of the Day
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'prompts'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Reflection Prompts
          </button>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500 text-sm">Loading content...</div>
          ) : activeTab === 'quotes' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Quote Text</th>
                    <th className="px-6 py-3 font-semibold">Author</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quotes.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900 italic">
                        &quot;{q.text}&quot;
                      </td>
                      <td className="px-6 py-4 text-gray-600">{q.author || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <Badge variant={q.status === 'published' ? 'published' : 'draft'}>
                          {q.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingQuote(q)}>
                          <Edit2 className="w-4 h-4 mr-1 inline" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuote(q.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4 mr-1 inline" /> Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : activeTab === 'words' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Word</th>
                    <th className="px-6 py-3 font-semibold">Meaning</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {words.map((w) => (
                    <tr key={w.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900 tracking-wider font-mono">
                        {w.word}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{w.meaning || '—'}</td>
                      <td className="px-6 py-4">
                        <Badge variant={w.status === 'published' ? 'published' : 'draft'}>
                          {w.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingWord(w)}>
                          <Edit2 className="w-4 h-4 mr-1 inline" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWord(w.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4 mr-1 inline" /> Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Prompt</th>
                    <th className="px-6 py-3 font-semibold">Category</th>
                    <th className="px-6 py-3 font-semibold">Active</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {prompts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{p.prompt}</td>
                      <td className="px-6 py-4 text-gray-500">{p.category || 'General'}</td>
                      <td className="px-6 py-4">
                        <Badge variant={p.active ? 'published' : 'draft'}>
                          {p.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingPrompt(p)}>
                          <Edit2 className="w-4 h-4 mr-1 inline" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePrompt(p.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4 mr-1 inline" /> Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quote Modal */}
        {editingQuote && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-lg text-gray-900">
                  {editingQuote.id ? 'Edit Quote' : 'New Quote'}
                </h3>
                <button
                  onClick={() => setEditingQuote(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveQuote} className="space-y-4">
                <FormField label="Quote Text" required>
                  <textarea
                    rows={3}
                    value={editingQuote.text || ''}
                    onChange={(e) => setEditingQuote({ ...editingQuote, text: e.target.value })}
                    placeholder="Enter inspirational quote..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </FormField>

                <FormField label="Author">
                  <input
                    type="text"
                    value={editingQuote.author || ''}
                    onChange={(e) => setEditingQuote({ ...editingQuote, author: e.target.value })}
                    placeholder="e.g. Marc Andreessen"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </FormField>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button type="button" variant="ghost" onClick={() => setEditingQuote(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    <Save className="w-4 h-4 mr-1.5" />
                    {isSubmitting ? 'Saving...' : 'Save Quote'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Word Modal */}
        {editingWord && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-lg text-gray-900">
                  {editingWord.id ? 'Edit Word' : 'New Manifestation Word'}
                </h3>
                <button
                  onClick={() => setEditingWord(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveWord} className="space-y-4">
                <FormField label="Word" required>
                  <input
                    type="text"
                    value={editingWord.word || ''}
                    onChange={(e) => setEditingWord({ ...editingWord, word: e.target.value })}
                    placeholder="e.g. RELENTLESS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase font-mono"
                    required
                  />
                </FormField>

                <FormField label="Meaning & Context">
                  <textarea
                    rows={2}
                    value={editingWord.meaning || ''}
                    onChange={(e) => setEditingWord({ ...editingWord, meaning: e.target.value })}
                    placeholder="Definition or tactical context..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </FormField>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button type="button" variant="ghost" onClick={() => setEditingWord(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    <Save className="w-4 h-4 mr-1.5" />
                    {isSubmitting ? 'Saving...' : 'Save Word'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Prompt Modal */}
        {editingPrompt && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-lg text-gray-900">
                  {editingPrompt.id ? 'Edit Prompt' : 'New Reflection Prompt'}
                </h3>
                <button
                  onClick={() => setEditingPrompt(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSavePrompt} className="space-y-4">
                <FormField label="Reflection Prompt" required>
                  <textarea
                    rows={3}
                    value={editingPrompt.prompt || ''}
                    onChange={(e) => setEditingPrompt({ ...editingPrompt, prompt: e.target.value })}
                    placeholder="e.g. What is the single highest leverage decision you made today?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </FormField>

                <FormField label="Category">
                  <input
                    type="text"
                    value={editingPrompt.category || ''}
                    onChange={(e) =>
                      setEditingPrompt({ ...editingPrompt, category: e.target.value })
                    }
                    placeholder="e.g. Decision Making / Strategy"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </FormField>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button type="button" variant="ghost" onClick={() => setEditingPrompt(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    <Save className="w-4 h-4 mr-1.5" />
                    {isSubmitting ? 'Saving...' : 'Save Prompt'}
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
