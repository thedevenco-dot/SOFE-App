import { AdminTaxonomyController } from './admin-taxonomy.controller';
import { AdminTaxonomyService } from './admin-taxonomy.service';

describe('AdminTaxonomyController', () => {
  let controller: AdminTaxonomyController;
  let service: jest.Mocked<AdminTaxonomyService>;

  beforeEach(() => {
    service = {
      listCategories: jest.fn().mockResolvedValue([{ id: 'cat-1', name: 'Tech' }]),
      getCategoryById: jest.fn().mockResolvedValue({ id: 'cat-1', name: 'Tech' }),
      createCategory: jest.fn().mockResolvedValue({ id: 'cat-1', name: 'Tech' }),
      updateCategory: jest.fn().mockResolvedValue({ id: 'cat-1', name: 'Tech 2' }),
      deleteCategory: jest.fn().mockResolvedValue({ success: true, message: 'Deleted' }),

      listInstructors: jest.fn().mockResolvedValue([{ id: 'inst-1', name: 'Sam Altman' }]),
      getInstructorById: jest.fn().mockResolvedValue({ id: 'inst-1', name: 'Sam Altman' }),
      createInstructor: jest.fn().mockResolvedValue({ id: 'inst-1', name: 'Sam Altman' }),
      updateInstructor: jest.fn().mockResolvedValue({ id: 'inst-1', name: 'Sam A.' }),
      deleteInstructor: jest.fn().mockResolvedValue({ success: true, message: 'Deleted' }),

      listTopics: jest.fn().mockResolvedValue([{ id: 'top-1', name: 'Fundraising' }]),
      getTopicById: jest.fn().mockResolvedValue({ id: 'top-1', name: 'Fundraising' }),
      createTopic: jest.fn().mockResolvedValue({ id: 'top-1', name: 'Fundraising' }),
      updateTopic: jest.fn().mockResolvedValue({ id: 'top-1', name: 'Fundraising 2' }),
      deleteTopic: jest.fn().mockResolvedValue({ success: true, message: 'Deleted' }),

      listAuthors: jest.fn().mockResolvedValue([{ id: 'auth-1', name: 'Paul Graham' }]),
      getAuthorById: jest.fn().mockResolvedValue({ id: 'auth-1', name: 'Paul Graham' }),
      createAuthor: jest.fn().mockResolvedValue({ id: 'auth-1', name: 'Paul Graham' }),
      updateAuthor: jest.fn().mockResolvedValue({ id: 'auth-1', name: 'P. Graham' }),
      deleteAuthor: jest.fn().mockResolvedValue({ success: true, message: 'Deleted' }),
    } as unknown as jest.Mocked<AdminTaxonomyService>;

    controller = new AdminTaxonomyController(service);
  });

  describe('Categories', () => {
    it('listCategories delegates to service', async () => {
      const res = await controller.listCategories();
      expect(service.listCategories).toHaveBeenCalled();
      expect(res).toEqual([{ id: 'cat-1', name: 'Tech' }]);
    });

    it('getCategoryById delegates to service', async () => {
      const res = await controller.getCategoryById('cat-1');
      expect(service.getCategoryById).toHaveBeenCalledWith('cat-1');
      expect(res).toEqual({ id: 'cat-1', name: 'Tech' });
    });

    it('createCategory delegates to service', async () => {
      const dto = { name: 'Tech', slug: 'tech', order: 0 };
      const res = await controller.createCategory(dto);
      expect(service.createCategory).toHaveBeenCalledWith(dto);
      expect(res).toEqual({ id: 'cat-1', name: 'Tech' });
    });

    it('updateCategory delegates to service', async () => {
      const res = await controller.updateCategory('cat-1', { name: 'Tech 2' });
      expect(service.updateCategory).toHaveBeenCalledWith('cat-1', { name: 'Tech 2' });
      expect(res).toEqual({ id: 'cat-1', name: 'Tech 2' });
    });

    it('deleteCategory delegates to service', async () => {
      const res = await controller.deleteCategory('cat-1');
      expect(service.deleteCategory).toHaveBeenCalledWith('cat-1');
      expect(res).toEqual({ success: true, message: 'Deleted' });
    });
  });

  describe('Instructors', () => {
    it('listInstructors delegates to service', async () => {
      const res = await controller.listInstructors();
      expect(service.listInstructors).toHaveBeenCalled();
      expect(res).toBeDefined();
    });

    it('createInstructor delegates to service', async () => {
      const dto = { name: 'Sam Altman', links: [] };
      const res = await controller.createInstructor(dto);
      expect(service.createInstructor).toHaveBeenCalledWith(dto);
      expect(res).toBeDefined();
    });

    it('updateInstructor delegates to service', async () => {
      const res = await controller.updateInstructor('inst-1', { name: 'Sam A.' });
      expect(service.updateInstructor).toHaveBeenCalledWith('inst-1', { name: 'Sam A.' });
      expect(res).toBeDefined();
    });

    it('deleteInstructor delegates to service', async () => {
      const res = await controller.deleteInstructor('inst-1');
      expect(service.deleteInstructor).toHaveBeenCalledWith('inst-1');
      expect(res).toBeDefined();
    });
  });

  describe('Topics', () => {
    it('listTopics delegates to service', async () => {
      const res = await controller.listTopics();
      expect(service.listTopics).toHaveBeenCalled();
      expect(res).toBeDefined();
    });

    it('createTopic delegates to service', async () => {
      const dto = { name: 'Fundraising', slug: 'fundraising', order: 0, isTab: false };
      const res = await controller.createTopic(dto);
      expect(service.createTopic).toHaveBeenCalledWith(dto);
      expect(res).toBeDefined();
    });

    it('updateTopic delegates to service', async () => {
      const res = await controller.updateTopic('top-1', { name: 'Fundraising 2' });
      expect(service.updateTopic).toHaveBeenCalledWith('top-1', { name: 'Fundraising 2' });
      expect(res).toBeDefined();
    });

    it('deleteTopic delegates to service', async () => {
      const res = await controller.deleteTopic('top-1');
      expect(service.deleteTopic).toHaveBeenCalledWith('top-1');
      expect(res).toBeDefined();
    });
  });

  describe('Authors', () => {
    it('listAuthors delegates to service', async () => {
      const res = await controller.listAuthors();
      expect(service.listAuthors).toHaveBeenCalled();
      expect(res).toBeDefined();
    });

    it('createAuthor delegates to service', async () => {
      const dto = { name: 'Paul Graham' };
      const res = await controller.createAuthor(dto);
      expect(service.createAuthor).toHaveBeenCalledWith(dto);
      expect(res).toBeDefined();
    });

    it('updateAuthor delegates to service', async () => {
      const res = await controller.updateAuthor('auth-1', { name: 'P. Graham' });
      expect(service.updateAuthor).toHaveBeenCalledWith('auth-1', { name: 'P. Graham' });
      expect(res).toBeDefined();
    });

    it('deleteAuthor delegates to service', async () => {
      const res = await controller.deleteAuthor('auth-1');
      expect(service.deleteAuthor).toHaveBeenCalledWith('auth-1');
      expect(res).toBeDefined();
    });
  });
});
