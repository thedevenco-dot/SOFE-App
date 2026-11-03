'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HelpCircle, Plus, Upload, Edit2, Trash2, AlertCircle, Search } from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { adminApiClient } from '../../lib/api-client';

export interface QuizListItem {
  id: string;
  title: string;
  kind: 'quick_quiz' | 'lesson_quiz';
  passingScorePercent: number;
  questionCount: number;
  status: 'draft' | 'published';
  createdAt?: string;
  updatedAt?: string;
}

export default function QuizzesListPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [kindFilter, setKindFilter] = useState<string>('all');

  const fetchQuizzes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (kindFilter !== 'all') params.append('kind', kindFilter);
      if (search.trim()) params.append('search', search.trim());

      const data = await adminApiClient.request<{ items: QuizListItem[] }>(
        `/admin/quizzes?${params.toString()}`,
      );
      setQuizzes(data.items || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load quizzes');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, kindFilter, search]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete quiz "${title}"?`)) return;
    try {
      await adminApiClient.request(`/admin/quizzes/${id}`, { method: 'DELETE' });
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      alert((err as Error).message || 'Failed to delete quiz');
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-primary-600" />
              Quizzes & Question Bank (CS17)
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create, curate, and configure rapid calibration scenarios and lesson assessments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/quizzes/import">
              <Button variant="secondary" className="flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                Import CSV
              </Button>
            </Link>
            <Link href="/quizzes/new">
              <Button variant="primary" className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                New Quiz
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search quiz title..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Kinds</option>
              <option value="quick_quiz">Quick Quiz</option>
              <option value="lesson_quiz">Lesson Quiz</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm border border-red-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500 text-sm">Loading quizzes...</div>
          ) : quizzes.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              No quizzes found. Click <strong>New Quiz</strong> or <strong>Import CSV</strong> to
              create one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Title</th>
                    <th className="px-6 py-3 font-semibold">Kind</th>
                    <th className="px-6 py-3 font-semibold">Questions</th>
                    <th className="px-6 py-3 font-semibold">Passing Threshold</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{quiz.title}</td>
                      <td className="px-6 py-4">
                        <Badge variant="slate">
                          {quiz.kind === 'quick_quiz' ? 'Quick Quiz' : 'Lesson Quiz'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold">{quiz.questionCount}</span> questions
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{quiz.passingScorePercent}%</td>
                      <td className="px-6 py-4">
                        <Badge variant={quiz.status === 'published' ? 'published' : 'draft'}>
                          {quiz.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/quizzes/${quiz.id}`)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <Edit2 className="w-4 h-4 mr-1 inline" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(quiz.id, quiz.title)}
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
      </div>
    </AdminShell>
  );
}
