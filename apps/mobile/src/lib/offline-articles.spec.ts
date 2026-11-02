import {
  saveArticleOffline,
  getOfflineArticles,
  getOfflineArticleBySlug,
  getOfflineArticleById,
  isArticleSavedOffline,
  removeArticleOffline,
  clearAllOfflineArticles,
} from './offline-articles';
import { __clearMockStore } from '../test-utils/expo-secure-store-mock';

describe('offline-articles storage utility', () => {
  beforeEach(async () => {
    __clearMockStore();
    await clearAllOfflineArticles();
  });

  const sampleArticle = {
    id: 'art-001',
    slug: 'pmf-framework',
    title: 'The Unforgiving Math of Product-Market Fit',
    excerpt: 'How seed stage founders quantify retention and early churn.',
    bodyHtml: '<p>Real PMF produces exponential pull.</p>',
    coverUrl: 'https://images.unsplash.com/photo-1',
    readTimeMin: 8,
    primaryTopic: { id: 'top-1', name: 'Product', slug: 'product' },
    author: { id: 'auth-1', name: 'Naveen Jain', title: 'Managing Director' },
  };

  it('saves an article offline and confirms it is marked as saved', async () => {
    expect(await isArticleSavedOffline('art-001')).toBe(false);
    expect(await isArticleSavedOffline('pmf-framework')).toBe(false);

    await saveArticleOffline(sampleArticle);

    expect(await isArticleSavedOffline('art-001')).toBe(true);
    expect(await isArticleSavedOffline('pmf-framework')).toBe(true);
  });

  it('retrieves saved article by slug and by id', async () => {
    await saveArticleOffline(sampleArticle);

    const bySlug = await getOfflineArticleBySlug('pmf-framework');
    expect(bySlug).not.toBeNull();
    expect(bySlug?.title).toBe(sampleArticle.title);
    expect(bySlug?.bodyHtml).toBe(sampleArticle.bodyHtml);

    const byId = await getOfflineArticleById('art-001');
    expect(byId).not.toBeNull();
    expect(byId?.slug).toBe('pmf-framework');
  });

  it('lists all offline articles sorted by savedAt descending', async () => {
    await saveArticleOffline({ ...sampleArticle, id: 'art-001', slug: 'art-1' });
    await saveArticleOffline({ ...sampleArticle, id: 'art-002', slug: 'art-2' });

    const all = await getOfflineArticles();
    expect(all).toHaveLength(2);
    expect(all[0].id).toBe('art-002');
    expect(all[1].id).toBe('art-001');
  });

  it('removes article from offline storage by id or slug', async () => {
    await saveArticleOffline(sampleArticle);
    expect(await isArticleSavedOffline('pmf-framework')).toBe(true);

    await removeArticleOffline('pmf-framework');
    expect(await isArticleSavedOffline('pmf-framework')).toBe(false);
    expect(await getOfflineArticleBySlug('pmf-framework')).toBeNull();
  });
});
