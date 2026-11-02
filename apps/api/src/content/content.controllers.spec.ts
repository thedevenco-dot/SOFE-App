import { CoursesController } from './courses.controller';
import { ArticlesController } from './articles.controller';
import { TopicsController } from './topics.controller';
import { AuthorsController } from './authors.controller';
import { BooksController } from './books.controller';
import { VideosController } from './videos.controller';
import { SearchController } from './search.controller';
import { ContentService } from './content.service';

describe('Public Content Controllers (T2.9)', () => {
  let serviceMock: Record<string, jest.Mock>;

  beforeEach(() => {
    serviceMock = {
      listCourses: jest.fn().mockResolvedValue({ data: [{ id: 'c1' }], meta: { total: 1 } }),
      getCourseCategories: jest.fn().mockResolvedValue([{ id: 'cat1', name: 'Startups' }]),
      getCourseBySlug: jest.fn().mockResolvedValue({ id: 'c1', title: 'Course 1' }),
      listArticles: jest.fn().mockResolvedValue({ data: [{ id: 'a1' }], meta: { total: 1 } }),
      getArticlesFeed: jest.fn().mockResolvedValue({ featured: [], recent: [], topics: [] }),
      getArticleBySlug: jest.fn().mockResolvedValue({ id: 'a1', title: 'Article 1' }),
      listTopics: jest.fn().mockResolvedValue([{ id: 'top1', name: 'Fundraising' }]),
      getAuthorById: jest.fn().mockResolvedValue({ id: 'aut1', name: 'Naveen Jain' }),
      listBooks: jest.fn().mockResolvedValue({ data: [{ id: 'b1' }], meta: { total: 1 } }),
      getBookBySlug: jest.fn().mockResolvedValue({ id: 'b1', title: 'Book 1' }),
      listVideos: jest.fn().mockResolvedValue({ data: [{ id: 'v1' }], meta: { total: 1 } }),
      getVideoBySlug: jest.fn().mockResolvedValue({ id: 'v1', title: 'Video 1' }),
      search: jest.fn().mockResolvedValue({ data: {}, meta: { total: 0 } }),
    };
  });

  describe('CoursesController', () => {
    it('should list courses, get categories, and get course by slug', async () => {
      const controller = new CoursesController(serviceMock as unknown as ContentService);

      const listRes = await controller.listCourses({ limit: 10, price: 'free' });
      expect(listRes.data).toBeDefined();
      expect(serviceMock.listCourses).toHaveBeenCalledWith({ limit: 10, price: 'free' });

      const catRes = await controller.getCategories();
      expect(catRes.data).toBeDefined();
      expect(serviceMock.getCourseCategories).toHaveBeenCalled();

      const detailRes = await controller.getCourseBySlug('slug-1');
      expect(detailRes.data).toBeDefined();
      expect(serviceMock.getCourseBySlug).toHaveBeenCalledWith('slug-1');
    });
  });

  describe('ArticlesController', () => {
    it('should list articles, get feed, and get article by slug', async () => {
      const controller = new ArticlesController(serviceMock as unknown as ContentService);

      const listRes = await controller.listArticles({ limit: 10 });
      expect(listRes.data).toBeDefined();
      expect(serviceMock.listArticles).toHaveBeenCalledWith({ limit: 10 });

      const feedRes = await controller.getFeed();
      expect(feedRes.data).toBeDefined();
      expect(serviceMock.getArticlesFeed).toHaveBeenCalled();

      const detailRes = await controller.getArticleBySlug('slug-art');
      expect(detailRes.data).toBeDefined();
      expect(serviceMock.getArticleBySlug).toHaveBeenCalledWith('slug-art');
    });
  });

  describe('TopicsController & AuthorsController', () => {
    it('should list topics and get author by id', async () => {
      const topicsController = new TopicsController(serviceMock as unknown as ContentService);
      const authorsController = new AuthorsController(serviceMock as unknown as ContentService);

      const topicsRes = await topicsController.listTopics('true');
      expect(topicsRes.data).toBeDefined();
      expect(serviceMock.listTopics).toHaveBeenCalledWith(true);

      const authorRes = await authorsController.getAuthorById('aut-1');
      expect(authorRes.data).toBeDefined();
      expect(serviceMock.getAuthorById).toHaveBeenCalledWith('aut-1');
    });
  });

  describe('BooksController & VideosController', () => {
    it('should list books and get book by slug', async () => {
      const booksController = new BooksController(serviceMock as unknown as ContentService);

      const listRes = await booksController.listBooks({ limit: 10 });
      expect(listRes.data).toBeDefined();
      expect(serviceMock.listBooks).toHaveBeenCalledWith({ limit: 10 });

      const detailRes = await booksController.getBookBySlug('book-slug');
      expect(detailRes.data).toBeDefined();
      expect(serviceMock.getBookBySlug).toHaveBeenCalledWith('book-slug');
    });

    it('should list standalone videos and get video by slug', async () => {
      const videosController = new VideosController(serviceMock as unknown as ContentService);

      const listRes = await videosController.listVideos({ limit: 10 });
      expect(listRes.data).toBeDefined();
      expect(serviceMock.listVideos).toHaveBeenCalledWith({ limit: 10 });

      const detailRes = await videosController.getVideoBySlug('video-slug');
      expect(detailRes.data).toBeDefined();
      expect(serviceMock.getVideoBySlug).toHaveBeenCalledWith('video-slug');
    });
  });

  describe('SearchController', () => {
    it('should perform unified search', async () => {
      const searchController = new SearchController(serviceMock as unknown as ContentService);

      const searchRes = await searchController.search({ q: 'venture' });
      expect(searchRes).toBeDefined();
      expect(serviceMock.search).toHaveBeenCalledWith({ q: 'venture' });
    });
  });
});
