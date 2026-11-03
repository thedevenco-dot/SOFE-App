'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Save, UserPlus, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import { Button } from '../../components/ui/Button';
import { FormField } from '../../components/ui/FormField';
import { adminApiClient } from '../../lib/api-client';
import type { PointsRulesDto } from '@sofe/shared';

export default function PointsRulesPage() {
  const [rules, setRules] = useState<PointsRulesDto>({
    quizPoints: 50,
    lessonPoints: 25,
    dailyStreakBonus: 50,
    maxDailyPoints: 500,
    freeCourseCost: 500,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Manual Adjust State
  const [targetUserId, setTargetUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState<number>(50);
  const [adjustNote, setAdjustNote] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  useEffect(() => {
    const loadRules = async () => {
      try {
        const data = await adminApiClient.request<PointsRulesDto>('/admin/points/rules');
        setRules(data);
      } catch (err) {
        setError((err as Error).message || 'Failed to load points rules');
      } finally {
        setIsLoading(false);
      }
    };
    loadRules();
  }, []);

  const handleSaveRules = async () => {
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      await adminApiClient.request('/admin/points/rules', {
        method: 'PUT',
        body: JSON.stringify(rules),
      });
      setSuccess('Points rules updated and audit logged successfully! (Applies to future awards)');
    } catch (err) {
      setError((err as Error).message || 'Failed to update rules');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError(null);
    setAdjustSuccess(null);

    if (!targetUserId.trim()) {
      setAdjustError('Target User ID is required');
      return;
    }
    if (!adjustNote.trim()) {
      setAdjustError('A justification note is required for points adjustments (CS23 audit policy)');
      return;
    }
    if (adjustAmount === 0) {
      setAdjustError('Adjustment amount cannot be zero');
      return;
    }

    setIsAdjusting(true);
    try {
      const res = await adminApiClient.request<{ balanceAfter: number }>('/admin/points/adjust', {
        method: 'POST',
        body: JSON.stringify({
          userId: targetUserId.trim(),
          amount: adjustAmount,
          reason: 'admin_adjust',
          note: adjustNote.trim(),
        }),
      });
      setAdjustSuccess(
        `Adjusted points for user ${targetUserId}. New balance: ${res.balanceAfter} pts.`,
      );
      setTargetUserId('');
      setAdjustNote('');
    } catch (err) {
      setAdjustError((err as Error).message || 'Failed to adjust points');
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-4xl pb-16">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary-600" />
            Points Engine & Rules (CS23)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure economy reward rules, daily caps, and perform audited manual ledger
            adjustments.
          </p>
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

        {/* Global Rules Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-md font-bold text-gray-900">
                Points & Economy Calculation Rules
              </h2>
              <p className="text-xs text-gray-500">
                Changes apply to future rewards only and are audit logged.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleSaveRules}
              disabled={isSaving || isLoading}
              className="flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Rules'}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Quiz Completion Points">
              <input
                type="number"
                min="0"
                value={rules.quizPoints}
                onChange={(e) => setRules({ ...rules, quizPoints: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </FormField>

            <FormField label="Lesson Completion Points">
              <input
                type="number"
                min="0"
                value={rules.lessonPoints}
                onChange={(e) => setRules({ ...rules, lessonPoints: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </FormField>

            <FormField label="Daily Streak Bonus Points">
              <input
                type="number"
                min="0"
                value={rules.dailyStreakBonus}
                onChange={(e) => setRules({ ...rules, dailyStreakBonus: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </FormField>

            <FormField label="Max Daily Points Cap">
              <input
                type="number"
                min="0"
                value={rules.maxDailyPoints}
                onChange={(e) => setRules({ ...rules, maxDailyPoints: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </FormField>

            <FormField label="Free Course Unlock Cost (Standard Default 500)">
              <input
                type="number"
                min="0"
                value={rules.freeCourseCost}
                onChange={(e) => setRules({ ...rules, freeCourseCost: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </FormField>
          </div>
        </div>

        {/* Manual User Points Adjustment Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-md font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600" />
              Manual Points Ledger Adjustment
            </h2>
            <p className="text-xs text-gray-500">
              Credit or debit user points. All manual balance adjustments are permanently audit
              logged.
            </p>
          </div>

          {adjustError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
              {adjustError}
            </div>
          )}

          {adjustSuccess && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-xs border border-green-200">
              {adjustSuccess}
            </div>
          )}

          <form onSubmit={handleAdjustPoints} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Target User ID" required>
                <input
                  type="text"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  placeholder="e.g. 650000000000000000000001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                />
              </FormField>

              <FormField label="Adjustment Amount (Positive to add, negative to deduct)" required>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                />
              </FormField>
            </div>

            <FormField label="Audit Justification Note (Required)" required>
              <input
                type="text"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                placeholder="Reason for adjustment, e.g. Community challenge winner / Refund correction"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </FormField>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="secondary"
                disabled={isAdjusting}
                className="flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                {isAdjusting ? 'Adjusting...' : 'Submit Points Adjustment'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminShell>
  );
}
