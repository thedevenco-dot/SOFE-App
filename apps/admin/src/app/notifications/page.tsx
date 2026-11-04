'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Bell, Plus, Send, CheckCircle, AlertCircle, RefreshCw, Users } from 'lucide-react';
import { AdminShell } from '../../components/layout/AdminShell';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { adminApiClient } from '../../lib/api-client';
import type { PushCampaignDto } from '@sofe/shared';

interface CampaignsListResponse {
  items: PushCampaignDto[];
  total: number;
  page: number;
  limit: number;
}

export default function NotificationsAdminPage() {
  const [campaigns, setCampaigns] = useState<PushCampaignDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApiClient.get<CampaignsListResponse>('/admin/push/campaigns');
      setCampaigns(data?.items || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load push campaigns');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleDispatchNow = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to dispatch campaign "${title}" immediately?`)) return;
    setDispatchingId(id);
    setError(null);
    try {
      await adminApiClient.post(`/admin/push/campaigns/${id}/dispatch`);
      setSuccess(`Campaign "${title}" dispatched successfully`);
      fetchCampaigns();
    } catch (err) {
      setError((err as Error).message || 'Failed to dispatch campaign');
    } finally {
      setDispatchingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge variant="published">Sent</Badge>;
      case 'scheduled':
        return <Badge variant="scheduled">Scheduled</Badge>;
      case 'cancelled':
        return <Badge variant="archived">Cancelled</Badge>;
      case 'draft':
      default:
        return <Badge variant="draft">Draft</Badge>;
    }
  };

  const formatSegment = (segment: PushCampaignDto['segment']) => {
    switch (segment.type) {
      case 'all':
        return 'All Active Learners';
      case 'inactive_7_days':
        return 'Inactive (7+ days)';
      case 'course_buyers':
        return `Course Buyers (${segment.courseId || 'any'})`;
      case 'topic_followers':
        return `Topic: ${segment.topicSlug || segment.topicId || 'all'}`;
      case 'test_device':
        return 'Test Devices Only';
      default:
        return segment.type;
    }
  };

  return (
    <AdminShell>
      <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'var(--color-white)',
                marginBottom: '4px',
              }}
            >
              Push Notification Campaigns
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>
              Broadcast real-time push campaigns and track open performance across iOS & Android
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="outline" onClick={fetchCampaigns} disabled={isLoading}>
              <RefreshCw size={16} style={{ marginRight: '6px' }} />
              Refresh
            </Button>
            <Link href="/notifications/composer">
              <Button variant="primary">
                <Plus size={16} style={{ marginRight: '6px' }} />
                New Push Campaign
              </Button>
            </Link>
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--color-danger)',
              borderRadius: '8px',
              color: 'var(--color-danger)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={18} />
            <span style={{ fontSize: '14px' }}>{error}</span>
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid var(--color-success)',
              borderRadius: '8px',
              color: 'var(--color-success)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <CheckCircle size={18} />
            <span style={{ fontSize: '14px' }}>{success}</span>
          </div>
        )}

        {/* Campaigns List */}
        <div
          style={{
            backgroundColor: 'var(--color-navy)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {isLoading ? (
            <div
              style={{
                padding: '48px',
                textAlign: 'center',
                color: 'var(--color-muted)',
              }}
            >
              Loading push campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div
              style={{
                padding: '64px 32px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-slate)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-orange)',
                }}
              >
                <Bell size={28} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-white)' }}>
                No push campaigns yet
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--color-muted)', maxWidth: '400px' }}>
                Create your first push campaign to engage learners, remind them of daily streaks, or
                announce new course drops.
              </p>
              <Link href="/notifications/composer">
                <Button variant="primary">
                  <Plus size={16} style={{ marginRight: '6px' }} />
                  Create First Push
                </Button>
              </Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--color-slate)',
                    borderBottom: '1px solid var(--color-border)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    color: 'var(--color-muted)',
                    letterSpacing: '0.05em',
                  }}
                >
                  <th style={{ padding: '16px' }}>Campaign</th>
                  <th style={{ padding: '16px' }}>Target Audience</th>
                  <th style={{ padding: '16px' }}>Status</th>
                  <th style={{ padding: '16px' }}>Sent / Scheduled</th>
                  <th style={{ padding: '16px' }}>Performance</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((camp) => {
                  const sentCount = camp.stats?.sent || 0;
                  const openCount = camp.stats?.opened || 0;
                  const openRate =
                    sentCount > 0 ? ((openCount / sentCount) * 100).toFixed(1) : '0.0';

                  return (
                    <tr
                      key={camp.id}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        fontSize: '14px',
                      }}
                    >
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--color-white)' }}>
                          {camp.title}
                        </div>
                        <div
                          style={{
                            fontSize: '13px',
                            color: 'var(--color-muted)',
                            marginTop: '2px',
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {camp.body}
                        </div>
                        {camp.deepLink && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--color-orange)',
                              marginTop: '4px',
                            }}
                          >
                            🔗 {camp.deepLink}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', color: 'var(--color-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={14} />
                          <span>{formatSegment(camp.segment)}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>{getStatusBadge(camp.status)}</td>
                      <td style={{ padding: '16px', color: 'var(--color-muted)' }}>
                        {camp.sentAt
                          ? new Date(camp.sentAt).toLocaleString()
                          : camp.scheduledAt
                            ? `Scheduled: ${new Date(camp.scheduledAt).toLocaleString()}`
                            : 'Draft'}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {camp.status === 'sent' ? (
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--color-white)',
                              }}
                            >
                              <span>{sentCount} sent</span>
                              <span style={{ color: 'var(--color-muted)' }}>•</span>
                              <span style={{ color: 'var(--color-success)' }}>
                                {openRate}% open
                              </span>
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-muted)' }}>
                              {openCount} opens recorded
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        {camp.status === 'draft' || camp.status === 'scheduled' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={dispatchingId === camp.id}
                            onClick={() => handleDispatchNow(camp.id, camp.title)}
                          >
                            <Send size={14} style={{ marginRight: '4px' }} />
                            {dispatchingId === camp.id ? 'Sending...' : 'Send Now'}
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
