export const SAMPLE_COURSE_DATA = {
  slug: 'founder-launchpad-zero-to-one',
  title: 'Founder Launchpad: Zero to One',
  subtitle:
    'The master playbook for validating your idea, closing your first customers, and raising seed capital.',
  descriptionHtml: `
    <h3>What you will learn</h3>
    <p>Founder Launchpad is designed specifically for aspiring and early-stage founders moving from idea exploration to real traction.</p>
    <ul>
      <li>Discovering non-obvious founder advantages and market asymmetries</li>
      <li>Crafting an MVP in 14 days without unnecessary technical debt</li>
      <li>Securing first 10 paying customers through cold outreach and high-touch discovery</li>
      <li>Structuring clean investor conversations and evaluating term sheets</li>
    </ul>
  `,
  thumbnailUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600',
  previewMuxPlaybackId: 'demo-playback-intro-123',
  tags: ['0 to 1', 'Fundraising', 'MVP', 'Sales'],
  level: 'beginner' as const,
  language: 'en',
  priceInr: 0, // Free launch course
  compareAtPriceInr: 499900,
  redeemableWithPoints: false,
  status: 'published' as const,
  publishedAt: new Date('2026-01-15T00:00:00.000Z'),
  modules: [
    {
      title: 'Module 1: The Founder Discovery Loop',
      order: 1,
      lessons: [
        {
          title: 'Lesson 1.1: Finding Your Unfair Advantage',
          order: 1,
          type: 'video' as const,
          isFreePreview: true,
          isRequired: true,
          durationSec: 480,
          video: {
            mux: {
              assetId: 'mux-asset-101',
              playbackId: 'mux-playback-101',
              status: 'ready' as const,
            },
          },
        },
        {
          title: 'Lesson 1.2: Customer Discovery & The Mom Test',
          order: 2,
          type: 'reading' as const,
          isFreePreview: true,
          isRequired: true,
          durationSec: 360,
          reading: {
            bodyHtml:
              '<p>Learn how to talk to potential customers without biasing their responses or seeking false validation.</p>',
          },
        },
      ],
    },
    {
      title: 'Module 2: Building & Shipping Your MVP',
      order: 2,
      lessons: [
        {
          title: 'Lesson 2.1: Defining the Core Value Loop',
          order: 1,
          type: 'video' as const,
          isFreePreview: false,
          isRequired: true,
          durationSec: 620,
          video: {
            mux: {
              assetId: 'mux-asset-201',
              playbackId: 'mux-playback-201',
              status: 'ready' as const,
            },
          },
        },
        {
          title: 'Lesson 2.2: MVP Architecture & Rapid Prototypes',
          order: 2,
          type: 'resource' as const,
          isFreePreview: false,
          isRequired: true,
          durationSec: 300,
          resource: {
            resources: [
              {
                title: 'Lean MVP Blueprint Template (PDF)',
                url: 'https://cdn.sofe.school/resources/lean-mvp-blueprint.pdf',
                kind: 'pdf' as const,
              },
            ],
          },
        },
      ],
    },
    {
      title: 'Module 3: Early Traction & Pitching',
      order: 3,
      lessons: [
        {
          title: 'Lesson 3.1: Securing Your First 10 Paying Customers',
          order: 1,
          type: 'video' as const,
          isFreePreview: false,
          isRequired: true,
          durationSec: 720,
          video: {
            mux: {
              assetId: 'mux-asset-301',
              playbackId: 'mux-playback-301',
              status: 'ready' as const,
            },
          },
        },
        {
          title: 'Lesson 3.2: Module 3 Capstone Assessment',
          order: 2,
          type: 'quiz' as const,
          isFreePreview: false,
          isRequired: true,
          durationSec: 400,
        },
      ],
    },
  ],
};
