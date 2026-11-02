import { getItem, setItem, deleteItem } from './secure-store';

const SAVED_ARTICLES_INDEX_KEY = 'sofe_offline_articles_index';
const ARTICLE_STORAGE_PREFIX = 'sofe_offline_article_';

export interface OfflineArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  bodyJson?: Record<string, unknown>;
  coverUrl: string;
  coverAlt?: string;
  readTimeMin: number;
  publishedAt?: string;
  primaryTopic?: {
    id: string;
    name: string;
    slug: string;
  };
  author?: {
    id: string;
    name: string;
    title?: string;
    avatarUrl?: string;
    bio?: string;
  };
  savedAt: string;
}

export async function getOfflineArticles(): Promise<OfflineArticle[]> {
  try {
    const rawIndex = await getItem(SAVED_ARTICLES_INDEX_KEY);
    if (!rawIndex) return [];
    const index: string[] = JSON.parse(rawIndex);
    if (!Array.isArray(index)) return [];

    const articles: OfflineArticle[] = [];
    for (const id of index) {
      const rawArticle = await getItem(`${ARTICLE_STORAGE_PREFIX}${id}`);
      if (rawArticle) {
        try {
          articles.push(JSON.parse(rawArticle));
        } catch {
          // ignore corrupted single entry
        }
      }
    }

    return articles.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  } catch {
    return [];
  }
}

export async function saveArticleOffline(
  article: Partial<OfflineArticle> & { id: string; slug: string; title: string },
): Promise<OfflineArticle> {
  const offlineItem: OfflineArticle = {
    id: article.id,
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt || '',
    bodyHtml: article.bodyHtml || '<p></p>',
    bodyJson: article.bodyJson,
    coverUrl: article.coverUrl || '',
    coverAlt: article.coverAlt,
    readTimeMin: article.readTimeMin || 5,
    publishedAt: article.publishedAt,
    primaryTopic: article.primaryTopic,
    author: article.author,
    savedAt: new Date().toISOString(),
  };

  await setItem(`${ARTICLE_STORAGE_PREFIX}${offlineItem.id}`, JSON.stringify(offlineItem));

  // Update index
  const rawIndex = await getItem(SAVED_ARTICLES_INDEX_KEY);
  let index: string[] = [];
  if (rawIndex) {
    try {
      index = JSON.parse(rawIndex);
    } catch {
      index = [];
    }
  }

  if (!index.includes(offlineItem.id)) {
    index.unshift(offlineItem.id);
    await setItem(SAVED_ARTICLES_INDEX_KEY, JSON.stringify(index));
  }

  return offlineItem;
}

export async function removeArticleOffline(idOrSlug: string): Promise<void> {
  const all = await getOfflineArticles();
  const target = all.find((a) => a.id === idOrSlug || a.slug === idOrSlug);
  if (!target) return;

  await deleteItem(`${ARTICLE_STORAGE_PREFIX}${target.id}`);

  const rawIndex = await getItem(SAVED_ARTICLES_INDEX_KEY);
  if (rawIndex) {
    try {
      const index: string[] = JSON.parse(rawIndex);
      const filtered = index.filter((id) => id !== target.id);
      await setItem(SAVED_ARTICLES_INDEX_KEY, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  }
}

export async function getOfflineArticleBySlug(slug: string): Promise<OfflineArticle | null> {
  const all = await getOfflineArticles();
  return all.find((a) => a.slug === slug) ?? null;
}

export async function getOfflineArticleById(id: string): Promise<OfflineArticle | null> {
  try {
    const rawArticle = await getItem(`${ARTICLE_STORAGE_PREFIX}${id}`);
    if (!rawArticle) return null;
    return JSON.parse(rawArticle);
  } catch {
    return null;
  }
}

export async function isArticleSavedOffline(idOrSlug: string): Promise<boolean> {
  const all = await getOfflineArticles();
  return all.some((a) => a.id === idOrSlug || a.slug === idOrSlug);
}

export async function clearAllOfflineArticles(): Promise<void> {
  const all = await getOfflineArticles();
  for (const item of all) {
    await deleteItem(`${ARTICLE_STORAGE_PREFIX}${item.id}`);
  }
  await deleteItem(SAVED_ARTICLES_INDEX_KEY);
}
