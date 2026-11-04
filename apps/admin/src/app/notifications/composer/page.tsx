'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Send, Smartphone, AlertCircle, CheckCircle, Link2 } from 'lucide-react';
import { AdminShell } from '../../../components/layout/AdminShell';
import { Button } from '../../../components/ui/Button';
import { adminApiClient } from '../../../lib/api-client';
import type { PushSegmentType, CreatePushCampaignDto } from '@sofe/shared';

const PRESET_DEEP_LINKS = [
  { label: 'Daily Practice', url: 'sofe://practise/daily' },
  { label: 'Points & Rewards', url: 'sofe://practise/points' },
  { label: 'Practice Home', url: 'sofe://practise' },
  { label: 'Courses Hub', url: 'sofe://learn' },
  { label: 'Startup World Articles', url: 'sofe://startup-world' },
];

export default function PushComposerPage() {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [segmentType, setSegmentType] = useState<PushSegmentType>('all');
  const [courseId, setCourseId] = useState('');
  const [topicSlug, setTopicSlug] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');

  // Test Push State
  const [testToken, setTestToken] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success: boolean; message: string } | null>(
    null,
  );

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSendTest = async () => {
    if (!testToken) {
      setTestFeedback({ success: false, message: 'Please enter an Expo push token' });
      return;
    }
    if (!title) {
      setTestFeedback({ success: false, message: 'Please enter a notification title' });
      return;
    }

    setIsSendingTest(true);
    setTestFeedback(null);

    try {
      const res = await adminApiClient.post<{ success: boolean; sent: number; failed: number }>(
        '/admin/push/test',
        {
          token: testToken.trim(),
          title: title.trim(),
          body: body.trim() || 'This is a test notification from SOFE Admin.',
          deepLink: deepLink.trim() || undefined,
        },
      );

      if (res?.sent > 0 || res?.success) {
        setTestFeedback({ success: true, message: 'Test notification delivered successfully!' });
      } else {
        setTestFeedback({
          success: false,
          message: 'Delivery returned 0 receipts (token may be invalid or unregistered)',
        });
      }
    } catch (err) {
      setTestFeedback({
        success: false,
        message: (err as Error).message || 'Failed to send test push',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSubmit = async (dispatchImmediately: boolean) => {
    if (!title.trim()) {
      setFormError('Notification title is required');
      return;
    }
    if (!body.trim()) {
      setFormError('Notification body is required');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const campaignPayload: CreatePushCampaignDto = {
        title: title.trim(),
        body: body.trim(),
        deepLink: deepLink.trim() || undefined,
        segment: {
          type: segmentType,
          courseId: segmentType === 'course_buyers' ? courseId.trim() || undefined : undefined,
          topicSlug: segmentType === 'topic_followers' ? topicSlug.trim() || undefined : undefined,
        },
        scheduledAt: isScheduled && scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
      };

      const created = await adminApiClient.post<{ id: string }>(
        '/admin/push/campaigns',
        campaignPayload,
      );

      if (dispatchImmediately && created?.id) {
        await adminApiClient.post(`/admin/push/campaigns/${created.id}/dispatch`);
      }

      router.push('/notifications');
    } catch (err) {
      setFormError((err as Error).message || 'Failed to create campaign');
      setIsSubmitting(false);
    }
  };

  return (
    <AdminShell>
      <div style={{ padding: '32px', maxWidth: '1280px', margin: '0 auto' }}>
        {/* Top Back / Title */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            href="/notifications"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: 'var(--color-muted)',
              marginBottom: '12px',
              textDecoration: 'none',
            }}
          >
            <ChevronLeft size={16} />
            <span>Back to Campaigns</span>
          </Link>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'var(--color-white)',
              marginBottom: '4px',
            }}
          >
            Push Campaign Composer
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--color-muted)' }}>
            Draft, preview on an iPhone lock screen mockup, and dispatch cross-platform push
            notifications
          </p>
        </div>

        {formError && (
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
            <span style={{ fontSize: '14px' }}>{formError}</span>
          </div>
        )}

        {/* 2-Column Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)',
            gap: '32px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Composer Form */}
          <div
            style={{
              backgroundColor: 'var(--color-navy)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <h2
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--color-white)',
                marginBottom: '20px',
              }}
            >
              Notification Message
            </h2>

            {/* Title */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--color-white)',
                }}
              >
                <span>Title *</span>
                <span
                  style={{
                    color: title.length > 50 ? 'var(--color-danger)' : 'var(--color-muted)',
                  }}
                >
                  {title.length}/50
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
                placeholder="e.g. 🔥 Don't break your 5-day streak!"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'var(--color-slate)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-white)',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Body */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--color-white)',
                }}
              >
                <span>Body Copy *</span>
                <span
                  style={{
                    color: body.length > 150 ? 'var(--color-danger)' : 'var(--color-muted)',
                  }}
                >
                  {body.length}/150
                </span>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={150}
                rows={3}
                placeholder="e.g. Complete today’s 3-minute Founders Unit Economics drill to earn +25 points and stay ahead."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'var(--color-slate)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-white)',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Deep Link */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--color-white)',
                  marginBottom: '6px',
                }}
              >
                Deep Link URL (Optional)
              </div>
              <input
                type="text"
                value={deepLink}
                onChange={(e) => setDeepLink(e.target.value)}
                placeholder="sofe://practise/daily"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'var(--color-slate)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  color: 'var(--color-white)',
                  fontSize: '14px',
                  outline: 'none',
                  marginBottom: '8px',
                }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {PRESET_DEEP_LINKS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setDeepLink(preset.url)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: 'rgba(255, 132, 41, 0.1)',
                      border: '1px solid var(--color-orange)',
                      borderRadius: '6px',
                      color: 'var(--color-orange)',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Audience Segment */}
            <div style={{ marginBottom: '24px' }}>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--color-white)',
                  marginBottom: '12px',
                }}
              >
                Audience Segment
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  {
                    id: 'all',
                    title: 'All Active Learners',
                    desc: 'Broadcast to all devices with push enabled',
                  },
                  {
                    id: 'inactive_7_days',
                    title: 'Inactive (7+ Days)',
                    desc: 'Win-back learners who haven’t opened the app this week',
                  },
                  {
                    id: 'course_buyers',
                    title: 'Course Enrollees / Buyers',
                    desc: 'Target students enrolled in specific courses',
                  },
                  {
                    id: 'topic_followers',
                    title: 'Topic Followers',
                    desc: 'Target founders following specific startup themes',
                  },
                  {
                    id: 'test_device',
                    title: 'Test Devices Only',
                    desc: 'Restricted to internal QA devices',
                  },
                ].map((seg) => (
                  <label
                    key={seg.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      padding: '12px',
                      backgroundColor:
                        segmentType === seg.id ? 'var(--color-slate)' : 'transparent',
                      border: `1px solid ${segmentType === seg.id ? 'var(--color-orange)' : 'var(--color-border)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="segment"
                      value={seg.id}
                      checked={segmentType === seg.id}
                      onChange={() => setSegmentType(seg.id as PushSegmentType)}
                      style={{ marginTop: '3px' }}
                    />
                    <div>
                      <div
                        style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-white)' }}
                      >
                        {seg.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-muted)' }}>
                        {seg.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {segmentType === 'course_buyers' && (
                <div style={{ marginTop: '12px' }}>
                  <input
                    type="text"
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    placeholder="Course ID or slug (optional, blank = any course)"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-slate)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      color: 'var(--color-white)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              )}

              {segmentType === 'topic_followers' && (
                <div style={{ marginTop: '12px' }}>
                  <input
                    type="text"
                    value={topicSlug}
                    onChange={(e) => setTopicSlug(e.target.value)}
                    placeholder="Topic slug (e.g. fundraising, product-market-fit)"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--color-slate)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '6px',
                      color: 'var(--color-white)',
                      fontSize: '13px',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Schedule / Timing */}
            <div style={{ marginBottom: '28px' }}>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--color-white)',
                  marginBottom: '12px',
                }}
              >
                Dispatch Schedule
              </h2>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                <label
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <input
                    type="radio"
                    name="scheduleRadio"
                    checked={!isScheduled}
                    onChange={() => setIsScheduled(false)}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--color-white)' }}>
                    Send immediately
                  </span>
                </label>
                <label
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <input
                    type="radio"
                    name="scheduleRadio"
                    checked={isScheduled}
                    onChange={() => setIsScheduled(true)}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--color-white)' }}>
                    Schedule for later
                  </span>
                </label>
              </div>

              {isScheduled && (
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-slate)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-white)',
                    fontSize: '13px',
                  }}
                />
              )}
            </div>

            {/* Send Test to Me Section */}
            <div
              style={{
                backgroundColor: 'var(--color-slate)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--color-white)',
                  marginBottom: '6px',
                }}
              >
                <Smartphone size={16} color="var(--color-orange)" />
                <span>Send Test to Me</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: '10px' }}>
                Verify formatting and deep link on your physical phone before sending to learners.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={testToken}
                  onChange={(e) => setTestToken(e.target.value)}
                  placeholder="ExponentPushToken[xxxxxxxxxxxxxx]"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    backgroundColor: 'var(--color-navy)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    color: 'var(--color-white)',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendTest}
                  disabled={isSendingTest}
                >
                  {isSendingTest ? 'Sending...' : 'Send Test'}
                </Button>
              </div>

              {testFeedback && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: testFeedback.success ? 'var(--color-success)' : 'var(--color-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {testFeedback.success ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  <span>{testFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Bottom Form Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button variant="outline" disabled={isSubmitting} onClick={() => handleSubmit(false)}>
                Save as Draft
              </Button>
              <Button variant="primary" disabled={isSubmitting} onClick={() => handleSubmit(true)}>
                <Send size={16} style={{ marginRight: '6px' }} />
                {isSubmitting
                  ? 'Processing...'
                  : isScheduled
                    ? 'Schedule Campaign'
                    : 'Dispatch Push Now'}
              </Button>
            </div>
          </div>

          {/* Right Column: Live iPhone Mockup Preview */}
          <div
            style={{
              position: 'sticky',
              top: '24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--color-muted)',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Live iOS Lock Screen Preview
            </div>

            {/* iPhone Frame */}
            <div
              style={{
                width: '320px',
                height: '620px',
                backgroundColor: '#0a0a0a',
                borderRadius: '44px',
                border: '6px solid #2b2b2b',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Dynamic Island / Notch */}
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '96px',
                  height: '24px',
                  backgroundColor: '#000000',
                  borderRadius: '12px',
                  zIndex: 10,
                }}
              />

              {/* Status Bar */}
              <div
                style={{
                  height: '44px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0 24px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#ffffff',
                  paddingTop: '6px',
                }}
              >
                <span>9:41</span>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span>5G</span>
                  <div
                    style={{
                      width: '18px',
                      height: '9px',
                      border: '1px solid #ffffff',
                      borderRadius: '2px',
                      padding: '1px',
                    }}
                  >
                    <div style={{ width: '80%', height: '100%', backgroundColor: '#ffffff' }} />
                  </div>
                </div>
              </div>

              {/* Lockscreen Clock */}
              <div
                style={{
                  marginTop: '40px',
                  textAlign: 'center',
                  color: '#ffffff',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: '500', opacity: 0.8 }}>
                  Tuesday, November 4
                </div>
                <div style={{ fontSize: '54px', fontWeight: '700', letterSpacing: '-1px' }}>
                  09:41
                </div>
              </div>

              {/* Notification Banner Container */}
              <div style={{ padding: '0 16px', marginTop: '24px' }}>
                <div
                  style={{
                    backgroundColor: 'rgba(30, 41, 59, 0.85)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '18px',
                    padding: '12px 14px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  {/* Top Bar: Icon + App Name + Time */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '5px',
                          backgroundColor: '#FF8429',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: '800',
                          color: '#ffffff',
                        }}
                      >
                        S
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: 'rgba(255, 255, 255, 0.9)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        SOFE
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>now</span>
                  </div>

                  {/* Title */}
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '700',
                      color: '#ffffff',
                      marginBottom: '2px',
                      lineHeight: '1.25',
                    }}
                  >
                    {title || '🔥 Keep your streak alive!'}
                  </div>

                  {/* Body */}
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      lineHeight: '1.35',
                    }}
                  >
                    {body ||
                      'Take 3 minutes to test your founder unit economics and protect your learning momentum.'}
                  </div>

                  {/* Deep link pill */}
                  {deepLink && (
                    <div
                      style={{
                        marginTop: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 8px',
                        backgroundColor: 'rgba(255, 132, 41, 0.2)',
                        borderRadius: '10px',
                        fontSize: '10px',
                        color: '#FF8429',
                      }}
                    >
                      <Link2 size={10} />
                      <span>{deepLink}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Home Indicator */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '120px',
                  height: '4px',
                  backgroundColor: '#ffffff',
                  borderRadius: '2px',
                  opacity: 0.6,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
