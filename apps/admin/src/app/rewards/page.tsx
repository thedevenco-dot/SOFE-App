'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Gift, Plus, Edit2, Trash2, AlertCircle, CheckCircle, X, Save } from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { FormField } from '../../components/ui/FormField';
import { adminApiClient } from '../../lib/api-client';
import type { RewardDto, RewardType } from '@sofe/shared';

export default function RewardsCataloguePage() {
  const [rewards, setRewards] = useState<RewardDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal State
  const [editingReward, setEditingReward] = useState<Partial<RewardDto> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRewards = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.request<RewardDto[]>('/admin/rewards');
      setRewards(data || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load rewards');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete reward "${title}"?`)) return;
    try {
      await adminApiClient.request(`/admin/rewards/${id}`, { method: 'DELETE' });
      setRewards((prev) => prev.filter((r) => r.id !== id));
      setSuccess('Reward deleted successfully');
    } catch (err) {
      setError((err as Error).message || 'Failed to delete reward');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReward) return;
    setIsSubmitting(true);
    setError(null);

    try {
      if (editingReward.id) {
        await adminApiClient.request(`/admin/rewards/${editingReward.id}`, {
          method: 'PATCH',
          body: JSON.stringify(editingReward),
        });
        setSuccess('Reward updated successfully!');
      } else {
        await adminApiClient.request('/admin/rewards', {
          method: 'POST',
          body: JSON.stringify(editingReward),
        });
        setSuccess('Reward created successfully!');
      }
      setEditingReward(null);
      fetchRewards();
    } catch (err) {
      setError((err as Error).message || 'Failed to save reward');
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
              <Gift className="w-6 h-6 text-primary-600" />
              Rewards Catalogue (CS24)
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage redemption perks: course access passes, discounts, and milestone badges.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() =>
              setEditingReward({
                title: '',
                description: '',
                type: 'course_access',
                costPoints: 500,
                stock: null,
                status: 'active',
              })
            }
            className="flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Reward
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

        {/* Rewards Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500 text-sm">Loading rewards...</div>
          ) : rewards.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              No rewards created yet. Click <strong>Add Reward</strong> to list items in the store.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Title</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Points Cost</th>
                    <th className="px-6 py-3 font-semibold">Details / Stock</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rewards.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{r.title}</div>
                        <div className="text-xs text-gray-400 line-clamp-1">{r.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="slate">{r.type.replace('_', ' ').toUpperCase()}</Badge>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-primary-600">
                        {r.costPoints} pts
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {r.type === 'coupon' && r.couponCode && (
                          <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
                            {r.couponCode}
                          </span>
                        )}
                        {r.stock !== null && r.stock !== undefined ? (
                          <span>Stock: {r.stock}</span>
                        ) : (
                          <span className="text-gray-400">Unlimited stock</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={r.status === 'active' ? 'published' : 'draft'}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingReward(r)}
                          className="text-primary-600 hover:text-primary-800"
                        >
                          <Edit2 className="w-4 h-4 mr-1 inline" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(r.id, r.title)}
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

        {/* Create / Edit Modal */}
        {editingReward && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-bold text-lg text-gray-900">
                  {editingReward.id ? 'Edit Reward Item' : 'New Reward Item'}
                </h3>
                <button
                  onClick={() => setEditingReward(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <FormField label="Reward Title" required>
                  <input
                    type="text"
                    value={editingReward.title || ''}
                    onChange={(e) => setEditingReward({ ...editingReward, title: e.target.value })}
                    placeholder="e.g. 100% Course Access Pass"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </FormField>

                <FormField label="Description" required>
                  <textarea
                    rows={2}
                    value={editingReward.description || ''}
                    onChange={(e) =>
                      setEditingReward({ ...editingReward, description: e.target.value })
                    }
                    placeholder="Redemption instructions and perk details..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Type" required>
                    <select
                      value={editingReward.type || 'course_access'}
                      onChange={(e) =>
                        setEditingReward({
                          ...editingReward,
                          type: e.target.value as RewardType,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="course_access">Course Access</option>
                      <option value="coupon">Coupon Code</option>
                      <option value="badge">Profile Badge</option>
                    </select>
                  </FormField>

                  <FormField label="Cost (Points)" required>
                    <input
                      type="number"
                      min="1"
                      value={editingReward.costPoints || 500}
                      onChange={(e) =>
                        setEditingReward({
                          ...editingReward,
                          costPoints: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      required
                    />
                  </FormField>
                </div>

                {editingReward.type === 'coupon' && (
                  <FormField label="Coupon Promo Code">
                    <input
                      type="text"
                      value={editingReward.couponCode || ''}
                      onChange={(e) =>
                        setEditingReward({
                          ...editingReward,
                          couponCode: e.target.value,
                        })
                      }
                      placeholder="e.g. FOUNDER20"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase"
                    />
                  </FormField>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Stock Limit (Leave empty for unlimited)">
                    <input
                      type="number"
                      min="0"
                      value={editingReward.stock ?? ''}
                      onChange={(e) =>
                        setEditingReward({
                          ...editingReward,
                          stock: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      placeholder="Unlimited"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </FormField>

                  <FormField label="Status">
                    <select
                      value={editingReward.status || 'active'}
                      onChange={(e) =>
                        setEditingReward({
                          ...editingReward,
                          status: e.target.value as 'active' | 'inactive',
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </FormField>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button type="button" variant="ghost" onClick={() => setEditingReward(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" disabled={isSubmitting}>
                    <Save className="w-4 h-4 mr-1.5" />
                    {isSubmitting ? 'Saving...' : 'Save Reward'}
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
