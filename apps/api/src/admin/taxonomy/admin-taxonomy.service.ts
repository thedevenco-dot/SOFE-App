import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  CourseCategory,
  CourseCategoryDocument,
  Instructor,
  InstructorDocument,
  Topic,
  TopicDocument,
  Author,
  AuthorDocument,
} from '../../database/schemas';
import { CourseCategoryDto, InstructorDto, TopicDto, AuthorDto } from '@sofe/shared';

@Injectable()
export class AdminTaxonomyService {
  constructor(
    @InjectModel(CourseCategory.name)
    private readonly categoryModel: Model<CourseCategoryDocument>,
    @InjectModel(Instructor.name)
    private readonly instructorModel: Model<InstructorDocument>,
    @InjectModel(Topic.name)
    private readonly topicModel: Model<TopicDocument>,
    @InjectModel(Author.name)
    private readonly authorModel: Model<AuthorDocument>,
  ) {}

  // ==========================================
  // Categories (CS8)
  // ==========================================
  async listCategories(): Promise<CourseCategoryDocument[]> {
    return this.categoryModel.find().sort({ order: 1, name: 1 }).exec();
  }

  async getCategoryById(id: string): Promise<CourseCategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Invalid category ID' });
    }
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
    }
    return category;
  }

  async createCategory(dto: CourseCategoryDto): Promise<CourseCategoryDocument> {
    const existing = await this.categoryModel.findOne({
      $or: [{ slug: dto.slug.toLowerCase().trim() }, { name: dto.name.trim() }],
    });
    if (existing) {
      throw new ConflictException({
        code: 'CATEGORY_EXISTS',
        message: 'A category with this name or slug already exists',
      });
    }

    const category = new this.categoryModel({
      name: dto.name.trim(),
      slug: dto.slug.toLowerCase().trim(),
      order: dto.order ?? 0,
      iconUrl: dto.iconUrl,
    });
    return category.save();
  }

  async updateCategory(
    id: string,
    dto: Partial<CourseCategoryDto>,
  ): Promise<CourseCategoryDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Invalid category ID' });
    }

    if (dto.slug || dto.name) {
      const conflict = await this.categoryModel.findOne({
        _id: { $ne: id },
        $or: [
          ...(dto.slug ? [{ slug: dto.slug.toLowerCase().trim() }] : []),
          ...(dto.name ? [{ name: dto.name.trim() }] : []),
        ],
      });
      if (conflict) {
        throw new ConflictException({
          code: 'CATEGORY_EXISTS',
          message: 'Another category with this name or slug already exists',
        });
      }
    }

    const updated = await this.categoryModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...(dto.name && { name: dto.name.trim() }),
            ...(dto.slug && { slug: dto.slug.toLowerCase().trim() }),
            ...(dto.order !== undefined && { order: dto.order }),
            ...(dto.iconUrl !== undefined && { iconUrl: dto.iconUrl }),
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
    }
    return updated;
  }

  async deleteCategory(id: string): Promise<{ success: boolean; id: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Invalid category ID' });
    }
    const result = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
    }
    return { success: true, id };
  }

  // ==========================================
  // Instructors (CS9)
  // ==========================================
  async listInstructors(): Promise<InstructorDocument[]> {
    return this.instructorModel.find().sort({ name: 1 }).exec();
  }

  async getInstructorById(id: string): Promise<InstructorDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: 'INSTRUCTOR_NOT_FOUND',
        message: 'Invalid instructor ID',
      });
    }
    const instructor = await this.instructorModel.findById(id).exec();
    if (!instructor) {
      throw new NotFoundException({
        code: 'INSTRUCTOR_NOT_FOUND',
        message: 'Instructor not found',
      });
    }
    return instructor;
  }

  async createInstructor(dto: InstructorDto): Promise<InstructorDocument> {
    const existing = await this.instructorModel.findOne({ name: dto.name.trim() });
    if (existing) {
      throw new ConflictException({
        code: 'INSTRUCTOR_EXISTS',
        message: 'An instructor with this name already exists',
      });
    }

    const instructor = new this.instructorModel({
      name: dto.name.trim(),
      title: dto.title?.trim(),
      bio: dto.bio?.trim(),
      avatarUrl: dto.avatarUrl,
      links: dto.links || [],
      userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
    });
    return instructor.save();
  }

  async updateInstructor(id: string, dto: Partial<InstructorDto>): Promise<InstructorDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: 'INSTRUCTOR_NOT_FOUND',
        message: 'Invalid instructor ID',
      });
    }

    if (dto.name) {
      const conflict = await this.instructorModel.findOne({
        _id: { $ne: id },
        name: dto.name.trim(),
      });
      if (conflict) {
        throw new ConflictException({
          code: 'INSTRUCTOR_EXISTS',
          message: 'Another instructor with this name already exists',
        });
      }
    }

    const updated = await this.instructorModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...(dto.name && { name: dto.name.trim() }),
            ...(dto.title !== undefined && { title: dto.title?.trim() }),
            ...(dto.bio !== undefined && { bio: dto.bio?.trim() }),
            ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
            ...(dto.links !== undefined && { links: dto.links }),
            ...(dto.userId !== undefined && {
              userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
            }),
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException({
        code: 'INSTRUCTOR_NOT_FOUND',
        message: 'Instructor not found',
      });
    }
    return updated;
  }

  async deleteInstructor(id: string): Promise<{ success: boolean; id: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: 'INSTRUCTOR_NOT_FOUND',
        message: 'Invalid instructor ID',
      });
    }
    const result = await this.instructorModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException({
        code: 'INSTRUCTOR_NOT_FOUND',
        message: 'Instructor not found',
      });
    }
    return { success: true, id };
  }

  // ==========================================
  // Topics (CS15)
  // ==========================================
  async listTopics(): Promise<TopicDocument[]> {
    return this.topicModel.find().sort({ order: 1, name: 1 }).exec();
  }

  async getTopicById(id: string): Promise<TopicDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'TOPIC_NOT_FOUND', message: 'Invalid topic ID' });
    }
    const topic = await this.topicModel.findById(id).exec();
    if (!topic) {
      throw new NotFoundException({ code: 'TOPIC_NOT_FOUND', message: 'Topic not found' });
    }
    return topic;
  }

  async createTopic(dto: TopicDto): Promise<TopicDocument> {
    const existing = await this.topicModel.findOne({
      $or: [{ slug: dto.slug.toLowerCase().trim() }, { name: dto.name.trim() }],
    });
    if (existing) {
      throw new ConflictException({
        code: 'TOPIC_EXISTS',
        message: 'A topic with this name or slug already exists',
      });
    }

    const topic = new this.topicModel({
      name: dto.name.trim(),
      slug: dto.slug.toLowerCase().trim(),
      order: dto.order ?? 0,
      isTab: dto.isTab ?? false,
      description: dto.description?.trim(),
    });
    return topic.save();
  }

  async updateTopic(id: string, dto: Partial<TopicDto>): Promise<TopicDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'TOPIC_NOT_FOUND', message: 'Invalid topic ID' });
    }

    if (dto.slug || dto.name) {
      const conflict = await this.topicModel.findOne({
        _id: { $ne: id },
        $or: [
          ...(dto.slug ? [{ slug: dto.slug.toLowerCase().trim() }] : []),
          ...(dto.name ? [{ name: dto.name.trim() }] : []),
        ],
      });
      if (conflict) {
        throw new ConflictException({
          code: 'TOPIC_EXISTS',
          message: 'Another topic with this name or slug already exists',
        });
      }
    }

    const updated = await this.topicModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...(dto.name && { name: dto.name.trim() }),
            ...(dto.slug && { slug: dto.slug.toLowerCase().trim() }),
            ...(dto.order !== undefined && { order: dto.order }),
            ...(dto.isTab !== undefined && { isTab: dto.isTab }),
            ...(dto.description !== undefined && { description: dto.description?.trim() }),
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException({ code: 'TOPIC_NOT_FOUND', message: 'Topic not found' });
    }
    return updated;
  }

  async deleteTopic(id: string): Promise<{ success: boolean; id: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'TOPIC_NOT_FOUND', message: 'Invalid topic ID' });
    }
    const result = await this.topicModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException({ code: 'TOPIC_NOT_FOUND', message: 'Topic not found' });
    }
    return { success: true, id };
  }

  // ==========================================
  // Authors (CS16)
  // ==========================================
  async listAuthors(): Promise<AuthorDocument[]> {
    return this.authorModel.find().sort({ name: 1 }).exec();
  }

  async getAuthorById(id: string): Promise<AuthorDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'AUTHOR_NOT_FOUND', message: 'Invalid author ID' });
    }
    const author = await this.authorModel.findById(id).exec();
    if (!author) {
      throw new NotFoundException({ code: 'AUTHOR_NOT_FOUND', message: 'Author not found' });
    }
    return author;
  }

  async createAuthor(dto: AuthorDto): Promise<AuthorDocument> {
    const existing = await this.authorModel.findOne({ name: dto.name.trim() });
    if (existing) {
      throw new ConflictException({
        code: 'AUTHOR_EXISTS',
        message: 'An author with this name already exists',
      });
    }

    const author = new this.authorModel({
      name: dto.name.trim(),
      title: dto.title?.trim(),
      bio: dto.bio?.trim(),
      avatarUrl: dto.avatarUrl,
      userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
    });
    return author.save();
  }

  async updateAuthor(id: string, dto: Partial<AuthorDto>): Promise<AuthorDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'AUTHOR_NOT_FOUND', message: 'Invalid author ID' });
    }

    if (dto.name) {
      const conflict = await this.authorModel.findOne({
        _id: { $ne: id },
        name: dto.name.trim(),
      });
      if (conflict) {
        throw new ConflictException({
          code: 'AUTHOR_EXISTS',
          message: 'Another author with this name already exists',
        });
      }
    }

    const updated = await this.authorModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            ...(dto.name && { name: dto.name.trim() }),
            ...(dto.title !== undefined && { title: dto.title?.trim() }),
            ...(dto.bio !== undefined && { bio: dto.bio?.trim() }),
            ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
            ...(dto.userId !== undefined && {
              userId: dto.userId ? new Types.ObjectId(dto.userId) : undefined,
            }),
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException({ code: 'AUTHOR_NOT_FOUND', message: 'Author not found' });
    }
    return updated;
  }

  async deleteAuthor(id: string): Promise<{ success: boolean; id: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'AUTHOR_NOT_FOUND', message: 'Invalid author ID' });
    }
    const result = await this.authorModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException({ code: 'AUTHOR_NOT_FOUND', message: 'Author not found' });
    }
    return { success: true, id };
  }
}
