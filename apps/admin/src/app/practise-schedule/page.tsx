'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  AlertTriangle,
  Copy,
  Sparkles,
  Edit2,
  CheckCircle,
  AlertCircle,
  X,
  Save,
} from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FormField } from '../../components/ui/FormField';
import { adminApiClient } from '../../lib/api-client';
import type { PracticeSlotDto } from '@sofe/shared';

interface ScheduleDay {
  id?: string;
  dateKey: string;
  slots: PracticeSlotDto[];
}

export default function PracticeSchedulePage() {
  const [schedules, setSchedules] = useState<ScheduleDay[]>([]);
  const [unassignedDates, setUnassignedDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Copy Week Modal
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [sourceWeek, setSourceWeek] = useState('');
  const [targetWeek, setTargetWeek] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Date Modal
  const [editingDay, setEditingDay] = useState<ScheduleDay | null>(null);

  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.request<{
        schedules: ScheduleDay[];
        unassignedFutureDates: string[];
      }>('/admin/practise/schedule');
      setSchedules(data.schedules || []);
      setUnassignedDates(data.unassignedFutureDates || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load practice schedule');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const handleCopyWeek = async () => {
    if (!sourceWeek || !targetWeek) {
      alert('Please select both source and target start dates');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await adminApiClient.request('/admin/practise/schedule/copy-week', {
        method: 'POST',
        body: JSON.stringify({
          sourceFromDateKey: sourceWeek,
          targetFromDateKey: targetWeek,
        }),
      });
      setSuccess('Week schedule copied successfully!');
      setShowCopyModal(false);
      fetchSchedule();
    } catch (err) {
      setError((err as Error).message || 'Failed to copy week');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoFill = async () => {
    if (
      !confirm(
        'Auto-fill all missing dates in the next 14 days using published quizzes and prompts?',
      )
    )
      return;
    setIsSubmitting(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const future = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
      await adminApiClient.request('/admin/practise/schedule/auto-fill', {
        method: 'POST',
        body: JSON.stringify({ from: today, to: future }),
      });
      setSuccess('Auto-fill complete!');
      fetchSchedule();
    } catch (err) {
      setError((err as Error).message || 'Failed to auto-fill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDate = async () => {
    if (!editingDay) return;
    setIsSubmitting(true);
    try {
      await adminApiClient.request(`/admin/practise/schedule/${editingDay.dateKey}`, {
        method: 'PUT',
        body: JSON.stringify({ slots: editingDay.slots }),
      });
      setSuccess(`Schedule for ${editingDay.dateKey} saved!`);
      setEditingDay(null);
      fetchSchedule();
    } catch (err) {
      setError((err as Error).message || 'Failed to save date schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-primary-600" />
              Daily Practice Scheduler (CS22)
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Configure and orchestrate daily calibration slots: Quick Quiz, Brain Game, Scenario
              Drill, Concept Match, and Reflection.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={handleAutoFill}
              disabled={isSubmitting}
              className="flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Auto-Fill Missing
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10);
                const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
                setSourceWeek(today);
                setTargetWeek(nextWeek);
                setShowCopyModal(true);
              }}
              className="flex items-center gap-1.5"
            >
              <Copy className="w-4 h-4" />
              Copy a Week
            </Button>
          </div>
        </div>

        {/* Warning Banner for Unassigned Future Dates */}
        {unassignedDates.length > 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">
                Warning: {unassignedDates.length} upcoming days in the next 7 days have no practice
                schedule assigned!
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Unassigned: {unassignedDates.join(', ')}. Use <strong>Auto-Fill</strong> or{' '}
                <strong>Copy a Week</strong> to ensure learners have daily calibration content.
              </p>
            </div>
          </div>
        )}

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

        {/* Schedule List / Calendar Days */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500 text-sm bg-white rounded-xl border border-gray-200">
              Loading practice schedules...
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm bg-white rounded-xl border border-gray-200">
              No schedules assigned yet. Click <strong>Auto-Fill Missing</strong> to populate the
              upcoming days.
            </div>
          ) : (
            schedules.map((day) => (
              <div
                key={day.dateKey}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-primary-200 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900 text-base">{day.dateKey}</span>
                    <Badge variant="slate">
                      {new Date(`${day.dateKey}T00:00:00Z`).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingDay(JSON.parse(JSON.stringify(day)))}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    <Edit2 className="w-4 h-4 mr-1" /> Edit Slots
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {day.slots.map((slot, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase">
                        <span>{slot.slotKey.replace('_', ' ')}</span>
                        <span className="font-mono text-gray-500">{slot.refType}</span>
                      </div>
                      <p className="font-medium text-xs text-gray-800 truncate" title={slot.title}>
                        {slot.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Copy Week Modal */}
        {showCopyModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-lg text-gray-900">Copy Week Schedule Pattern</h3>
                <button
                  onClick={() => setShowCopyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Copies all 5 practice slots from a 7-day source span to another 7-day target span.
              </p>

              <FormField label="Source Week Start Date (YYYY-MM-DD)" required>
                <input
                  type="date"
                  value={sourceWeek}
                  onChange={(e) => setSourceWeek(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </FormField>

              <FormField label="Target Week Start Date (YYYY-MM-DD)" required>
                <input
                  type="date"
                  value={targetWeek}
                  onChange={(e) => setTargetWeek(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </FormField>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setShowCopyModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleCopyWeek} disabled={isSubmitting}>
                  {isSubmitting ? 'Copying...' : 'Copy Week'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Date Modal */}
        {editingDay && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-4 my-8">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-lg text-gray-900">
                  Edit Practice Slots for {editingDay.dateKey}
                </h3>
                <button
                  onClick={() => setEditingDay(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {editingDay.slots.map((slot, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3"
                  >
                    <span className="text-xs font-bold uppercase text-primary-700">
                      Slot {sIdx + 1}: {slot.slotKey}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FormField label="Title">
                        <input
                          type="text"
                          value={slot.title}
                          onChange={(e) => {
                            const updated = { ...editingDay };
                            updated.slots[sIdx].title = e.target.value;
                            setEditingDay(updated);
                          }}
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                        />
                      </FormField>

                      <FormField label="Linked Ref ID (Optional)">
                        <input
                          type="text"
                          value={slot.refId || ''}
                          onChange={(e) => {
                            const updated = { ...editingDay };
                            updated.slots[sIdx].refId = e.target.value;
                            setEditingDay(updated);
                          }}
                          placeholder="Quiz / Prompt ID"
                          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                        />
                      </FormField>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button variant="ghost" onClick={() => setEditingDay(null)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveDate} disabled={isSubmitting}>
                  <Save className="w-4 h-4 mr-1.5" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
