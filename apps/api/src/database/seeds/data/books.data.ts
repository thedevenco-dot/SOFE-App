export const SEED_BOOKS = [
  {
    slug: 'the-lean-startup-summary',
    title: 'The Lean Startup: Executive Summary & Field Guide',
    author: 'Eric Ries',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    format: 'summary' as const,
    summaryJson: {
      coreHypothesis:
        'Startups exist to learn how to build a sustainable business via validated learning.',
      keyTakeaways: [
        'Build-Measure-Learn feedback loop',
        'Validated learning over vanity metrics',
        'Pivot or persevere decision milestones',
      ],
    },
    tags: ['Lean', 'MVP', 'Methodology'],
    isFree: true,
    status: 'published' as const,
    publishedAt: new Date('2026-01-10T00:00:00.000Z'),
  },
  {
    slug: 'zero-to-one-notes',
    title: 'Zero to One: Notes on Startups & How to Build the Future',
    author: 'Peter Thiel',
    coverUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400',
    format: 'summary' as const,
    summaryJson: {
      coreHypothesis:
        'Creating new things takes us from 0 to 1, while copying what exists takes the world from 1 to n.',
      keyTakeaways: [
        'Proprietary technology that is 10x better',
        'Monopolistic secrets vs perfect competition',
        'Distribution is as vital as the product itself',
      ],
    },
    tags: ['Strategy', 'Monopoly', 'Future'],
    isFree: true,
    status: 'published' as const,
    publishedAt: new Date('2026-01-12T00:00:00.000Z'),
  },
  {
    slug: 'the-hard-thing-about-hard-things-summary',
    title: 'The Hard Thing About Hard Things: Founder Survival Manual',
    author: 'Ben Horowitz',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400',
    format: 'summary' as const,
    summaryJson: {
      coreHypothesis:
        'There is no formula for managing when everything goes wrong. You must cultivate wartime discipline.',
      keyTakeaways: [
        'Peacetime CEO vs Wartime CEO dynamics',
        'Managing founder psychology and isolation',
        'Evaluating executive talent and culture fit',
      ],
    },
    tags: ['Leadership', 'Crisis Management', 'Wartime'],
    isFree: true,
    status: 'published' as const,
    publishedAt: new Date('2026-01-14T00:00:00.000Z'),
  },
];
