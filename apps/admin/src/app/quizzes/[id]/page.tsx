'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  HelpCircle,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Save,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
} from 'lucide-react';
import { AdminShell } from '../../../components/layout/AdminShell';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/ui/FormField';
import { adminApiClient } from '../../../lib/api-client';

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

interface Question {
  id: string;
  text: string;
  type: 'single' | 'multi' | 'true_false';
  options: QuestionOption[];
  points?: number;
}

export default function QuizEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'quick_quiz' | 'lesson_quiz'>('quick_quiz');
  const [passingScorePercent, setPassingScorePercent] = useState<number>(80);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [questions, setQuestions] = useState<Question[]>([]);

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) {
      setQuestions([
        {
          id: `q_${Date.now()}_0`,
          text: 'What is the most critical metric for product-market fit?',
          type: 'single',
          points: 10,
          options: [
            {
              id: 'opt_0_0',
              text: '40%+ "Very Disappointed" on survey',
              isCorrect: true,
              explanation: 'Sean Ellis PMF benchmark.',
            },
            { id: 'opt_0_1', text: 'Instagram follower growth', isCorrect: false },
          ],
        },
      ]);
      return;
    }

    const loadQuiz = async () => {
      try {
        const quiz = await adminApiClient.request<{
          title: string;
          kind: 'quick_quiz' | 'lesson_quiz';
          passingScorePercent: number;
          status: 'draft' | 'published';
          questions: Question[];
        }>(`/admin/quizzes/${id}`);

        setTitle(quiz.title);
        setKind(quiz.kind);
        setPassingScorePercent(quiz.passingScorePercent || 80);
        setStatus(quiz.status);
        setQuestions(quiz.questions || []);
      } catch (err) {
        setError((err as Error).message || 'Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };

    loadQuiz();
  }, [id, isNew]);

  const handleAddQuestion = () => {
    const qIndex = questions.length;
    setQuestions([
      ...questions,
      {
        id: `q_${Date.now()}_${qIndex}`,
        text: '',
        type: 'single',
        points: 10,
        options: [
          { id: `opt_${qIndex}_0`, text: '', isCorrect: true, explanation: '' },
          { id: `opt_${qIndex}_1`, text: '', isCorrect: false },
        ],
      },
    ]);
  };

  const handleDuplicateQuestion = (idx: number) => {
    const target = questions[idx];
    const cloned: Question = {
      ...target,
      id: `q_${Date.now()}_copy`,
      text: `${target.text} (Copy)`,
      options: target.options.map((opt, oIdx) => ({
        ...opt,
        id: `opt_${Date.now()}_${oIdx}`,
      })),
    };
    const next = [...questions];
    next.splice(idx + 1, 0, cloned);
    setQuestions(next);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      alert('A quiz must have at least one question.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleMoveQuestion = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= questions.length) return;
    const next = [...questions];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setQuestions(next);
  };

  const handleAddOption = (qIdx: number) => {
    const q = questions[qIdx];
    if (q.options.length >= 6) {
      alert('Maximum 6 options per question allowed.');
      return;
    }
    const oIdx = q.options.length;
    const updated = [...questions];
    updated[qIdx].options.push({
      id: `opt_${qIdx}_${oIdx}`,
      text: '',
      isCorrect: false,
    });
    setQuestions(updated);
  };

  const handleRemoveOption = (qIdx: number, oIdx: number) => {
    const q = questions[qIdx];
    if (q.options.length <= 2) {
      alert('Questions must have at least 2 options.');
      return;
    }
    const updated = [...questions];
    updated[qIdx].options = q.options.filter((_, i) => i !== oIdx);
    setQuestions(updated);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError('Quiz title is required');
      return;
    }

    if (status === 'published' && questions.length < 3) {
      setError('Publishing requires at least 3 questions in the quiz (CS18 validation gate).');
      return;
    }

    // Validate options
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setError(`Question #${i + 1} prompt cannot be empty`);
        return;
      }
      const hasCorrect = q.options.some((o) => o.isCorrect);
      if (!hasCorrect) {
        setError(`Question #${i + 1} must have at least one correct option selected`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        title,
        kind,
        passingScorePercent,
        status,
        questions,
      };

      if (isNew) {
        const created = await adminApiClient.request<{ id: string }>('/admin/quizzes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccess('Quiz created successfully!');
        router.push(`/quizzes/${created.id}`);
      } else {
        await adminApiClient.request(`/admin/quizzes/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setSuccess('Quiz saved successfully!');
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to save quiz');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminShell>
        <div className="p-12 text-center text-gray-500 text-sm">Loading quiz...</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6 max-w-4xl pb-16">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/quizzes')}
              className="text-gray-500"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary-600" />
              {isNew ? 'Create Quiz & Question Bank (CS18)' : 'Edit Quiz & Question Bank (CS18)'}
            </h1>
          </div>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : 'Save Quiz'}
          </Button>
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

        {/* Quiz Level Settings Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-md font-semibold text-gray-800 border-b border-gray-100 pb-2">
            Quiz Settings
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Quiz Title" required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Unit Economics & CAC Rapid Calibration"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormField>

            <FormField label="Quiz Kind">
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as 'quick_quiz' | 'lesson_quiz')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="quick_quiz">Quick Quiz (Daily Practice)</option>
                <option value="lesson_quiz">Lesson Quiz (Curriculum Module)</option>
              </select>
            </FormField>

            <FormField label="Passing Threshold (%)">
              <input
                type="number"
                min="0"
                max="100"
                value={passingScorePercent}
                onChange={(e) => setPassingScorePercent(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </FormField>

            <FormField label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </FormField>
          </div>

          {status === 'published' && questions.length < 3 && (
            <p className="text-xs text-amber-600 font-medium">
              ⚠️ Note: Minimum 3 questions are required to publish this quiz.
            </p>
          )}
        </div>

        {/* Questions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Questions ({questions.length})</h2>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddQuestion}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Question
            </Button>
          </div>

          {questions.map((q, qIdx) => (
            <div
              key={q.id || qIdx}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                    {qIdx + 1}
                  </span>
                  <select
                    value={q.type}
                    onChange={(e) => {
                      const updated = [...questions];
                      updated[qIdx].type = e.target.value as 'single' | 'multi' | 'true_false';
                      setQuestions(updated);
                    }}
                    className="text-xs font-semibold uppercase bg-gray-100 text-gray-700 rounded-md px-2 py-1 border-0"
                  >
                    <option value="single">Single Choice</option>
                    <option value="multi">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveQuestion(qIdx, qIdx - 1)}
                    disabled={qIdx === 0}
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveQuestion(qIdx, qIdx + 1)}
                    disabled={qIdx === questions.length - 1}
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicateQuestion(qIdx)}
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveQuestion(qIdx)}
                    title="Delete"
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Question Text */}
              <FormField label="Question Prompt" required>
                <textarea
                  rows={2}
                  value={q.text}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[qIdx].text = e.target.value;
                    setQuestions(updated);
                  }}
                  placeholder="Enter the question scenario or prompt..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </FormField>

              {/* Options */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    Options & Correctness
                  </span>
                  {q.type !== 'true_false' && q.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => handleAddOption(qIdx)}
                      className="text-xs text-primary-600 font-semibold hover:underline"
                    >
                      + Add Option
                    </button>
                  )}
                </div>

                {q.options.map((opt, oIdx) => (
                  <div
                    key={opt.id || oIdx}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type={q.type === 'multi' ? 'checkbox' : 'radio'}
                        name={`correct_${qIdx}`}
                        checked={opt.isCorrect}
                        onChange={(e) => {
                          const updated = [...questions];
                          if (q.type === 'multi') {
                            updated[qIdx].options[oIdx].isCorrect = e.target.checked;
                          } else {
                            updated[qIdx].options.forEach((o, i) => {
                              o.isCorrect = i === oIdx;
                            });
                          }
                          setQuestions(updated);
                        }}
                        className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      />

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIdx].options[oIdx].text = e.target.value;
                          setQuestions(updated);
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + oIdx)} text...`}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />

                      {q.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(qIdx, oIdx)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {opt.isCorrect && (
                      <input
                        type="text"
                        value={opt.explanation || ''}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[qIdx].options[oIdx].explanation = e.target.value;
                          setQuestions(updated);
                        }}
                        placeholder="Explanation for why this option is correct (required for learner calibration)..."
                        className="w-full px-3 py-1.5 border border-green-200 bg-green-50 rounded-md text-xs text-green-900 focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
