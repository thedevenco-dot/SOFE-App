'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Download, AlertCircle, CheckCircle, ArrowLeft, Play } from 'lucide-react';
import { AdminShell } from '../../../components/layout/AdminShell';
import { Button } from '../../../components/ui/Button';
import { adminApiClient } from '../../../lib/api-client';
import type { CsvQuizImportRow, CsvImportDryRunResponse } from '@sofe/shared';

const SAMPLE_CSV = `quiz_title,question,type,option_a,option_b,option_c,option_d,option_e,option_f,correct,explanation,hint
Unit Economics Calibration,What is the ideal LTV:CAC ratio?,single,1:1,3:1,1:3,,,,,B,A 3:1 LTV:CAC ratio is the healthy standard.,Think about payback period
Unit Economics Calibration,Which of the following indicate cohort expansion?,multi,Logo Churn,Net Revenue Retention > 100%,Gross Margin Drop,,,,,B,NRR above 100% means existing cohorts spend more.,Expansion revenue
Unit Economics Calibration,High burn rate always equates to high valuation multiples.,true_false,True,False,,,,,,B,Burn efficiency and capital efficiency dictate valuation quality.,Efficiency matters`;

export default function CsvImportPage() {
  const router = useRouter();
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [dryRunResult, setDryRunResult] = useState<CsvImportDryRunResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const downloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'quiz_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvLines = (text: string): CsvQuizImportRow[] => {
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length <= 1) return [];

    // Header is line 0
    const rows: CsvQuizImportRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      // Simple CSV splitter handling quotes
      const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
      const values: string[] = [];
      let match;
      while ((match = regex.exec(lines[i])) !== null) {
        let val = match[1];
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1).replace(/""/g, '"');
        }
        values.push(val);
        if (regex.lastIndex === lines[i].length) break;
      }

      if (values.length >= 7) {
        rows.push({
          quiz_title: values[0] || '',
          question: values[1] || '',
          type: (values[2] as 'single' | 'multi' | 'true_false') || 'single',
          option_a: values[3] || '',
          option_b: values[4] || '',
          option_c: values[5] || undefined,
          option_d: values[6] || undefined,
          option_e: values[7] || undefined,
          option_f: values[8] || undefined,
          correct: values[9] || '',
          explanation: values[10] || '',
          hint: values[11] || undefined,
        });
      }
    }
    return rows;
  };

  const handleDryRun = async () => {
    setError(null);
    setSuccess(null);
    setIsValidating(true);
    try {
      const rows = parseCsvLines(csvText);
      if (rows.length === 0) {
        setError('No data rows found in the CSV text.');
        return;
      }
      if (rows.length > 500) {
        setError('CSV exceeds maximum limit of 500 rows.');
        return;
      }

      const res = await adminApiClient.request<CsvImportDryRunResponse>(
        '/admin/quizzes/import/preview',
        {
          method: 'POST',
          body: JSON.stringify({ rows }),
        },
      );
      setDryRunResult(res);
      if (res.errors.length === 0) {
        setSuccess(
          `Validation passed: ${res.validRows} questions across ${res.quizzesDetected} quizzes ready to import.`,
        );
      }
    } catch (err) {
      setError((err as Error).message || 'Validation request failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleExecuteImport = async () => {
    setError(null);
    setSuccess(null);
    setIsImporting(true);
    try {
      const rows = parseCsvLines(csvText);
      const res = await adminApiClient.request<{
        success: boolean;
        quizzesCreated: number;
        totalQuestions: number;
      }>('/admin/quizzes/import/execute', {
        method: 'POST',
        body: JSON.stringify({ rows }),
      });
      setSuccess(
        `Successfully imported ${res.totalQuestions} questions and created/updated ${res.quizzesCreated} quizzes!`,
      );
      setTimeout(() => router.push('/quizzes'), 1500);
    } catch (err) {
      setError((err as Error).message || 'Failed to execute import');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-4xl pb-16">
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
              <Upload className="w-5 h-5 text-primary-600" />
              CSV Quiz Import & Dry Run (CS19)
            </h1>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={downloadTemplate}
            className="flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Download Template
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

        {/* Input Text Area */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-800">
              CSV Data (Paste or edit, max 500 rows)
            </label>
            <span className="text-xs text-gray-400">
              Columns: quiz_title, question, type, option_a..option_f, correct, explanation, hint
            </span>
          </div>

          <textarea
            rows={10}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            className="w-full px-3 py-2 font-mono text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-gray-50"
            placeholder="quiz_title,question,type,option_a,option_b,correct,explanation..."
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={handleDryRun}
              disabled={isValidating || isImporting}
              className="flex items-center gap-1.5"
            >
              <Play className="w-4 h-4" />
              {isValidating ? 'Validating...' : 'Dry-Run Validation'}
            </Button>
            <Button
              variant="primary"
              onClick={handleExecuteImport}
              disabled={
                !dryRunResult ||
                dryRunResult.errors.length > 0 ||
                isImporting ||
                dryRunResult.validRows === 0
              }
              className="flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              {isImporting ? 'Importing...' : 'Commit Import'}
            </Button>
          </div>
        </div>

        {/* Dry-run Result Breakdown */}
        {dryRunResult && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-md font-bold text-gray-900 border-b border-gray-100 pb-2">
              Dry-Run Validation Results
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-xs text-gray-500">Total Rows</span>
                <p className="text-lg font-bold text-gray-800">{dryRunResult.totalRows}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                <span className="text-xs text-green-700">Valid Rows</span>
                <p className="text-lg font-bold text-green-800">{dryRunResult.validRows}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="text-xs text-red-700">Error Rows</span>
                <p className="text-lg font-bold text-red-800">{dryRunResult.errors.length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span className="text-xs text-blue-700">Quizzes Detected</span>
                <p className="text-lg font-bold text-blue-800">{dryRunResult.quizzesDetected}</p>
              </div>
            </div>

            {dryRunResult.errors.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold text-red-700">Row-by-Row Error Log:</h3>
                <div className="max-h-48 overflow-y-auto border border-red-200 rounded-lg bg-red-50 p-3 space-y-1 text-xs text-red-900 font-mono">
                  {dryRunResult.errors.map((err, idx) => (
                    <div key={idx}>
                      <strong>Row {err.row}</strong> [{err.field}]: {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dryRunResult.preview.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-sm font-semibold text-gray-800">
                  Preview (First 10 Questions):
                </h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-xs text-left text-gray-700">
                    <thead className="bg-gray-50 uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-2">Quiz</th>
                        <th className="px-4 py-2">Question</th>
                        <th className="px-4 py-2">Type</th>
                        <th className="px-4 py-2">Options</th>
                        <th className="px-4 py-2">Correct</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dryRunResult.preview.map((p, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 font-medium">{p.quizTitle}</td>
                          <td className="px-4 py-2">{p.questionText}</td>
                          <td className="px-4 py-2 uppercase">{p.type}</td>
                          <td className="px-4 py-2">{p.optionsCount} options</td>
                          <td className="px-4 py-2 font-semibold text-green-700">
                            {p.correctCount} correct
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
