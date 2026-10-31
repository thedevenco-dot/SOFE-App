import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Book, BookDocument } from '../../database/schemas/book.schema';
import { CreateBookDto, UpdateBookDto, BookFormat } from '@sofe/shared';

export interface BookFilterQuery {
  page?: number;
  limit?: number;
  status?: string;
  format?: string;
  categoryId?: string;
  isFree?: boolean | string;
  search?: string;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

@Injectable()
export class AdminBooksService {
  constructor(
    @InjectModel(Book.name)
    private readonly bookModel: Model<BookDocument>,
  ) {}

  // ==========================================
  // List Books (CS10)
  // ==========================================

  async listBooks(query: BookFilterQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    }

    if (query.format && query.format !== 'all') {
      filter.format = query.format;
    }

    if (query.categoryId && Types.ObjectId.isValid(query.categoryId)) {
      filter.categoryId = new Types.ObjectId(query.categoryId);
    }

    if (query.isFree !== undefined && query.isFree !== 'all') {
      filter.isFree = query.isFree === true || query.isFree === 'true';
    }

    if (query.search && query.search.trim()) {
      const escaped = query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ title: regex }, { author: regex }, { slug: regex }];
    }

    const [items, total] = await Promise.all([
      this.bookModel
        .find(filter)
        .populate('categoryId', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.bookModel.countDocuments(filter).exec(),
    ]);

    const mapped = items.map((b) => ({
      ...b.toObject(),
      id: b._id.toString(),
    }));

    return {
      data: mapped,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  // ==========================================
  // Get Book by ID
  // ==========================================

  async getBookById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'BOOK_NOT_FOUND', message: 'Invalid book ID' });
    }

    const book = await this.bookModel.findById(id).populate('categoryId', 'name slug').exec();

    if (!book) {
      throw new NotFoundException({ code: 'BOOK_NOT_FOUND', message: 'Book not found' });
    }

    return {
      ...book.toObject(),
      id: book._id.toString(),
    };
  }

  // ==========================================
  // Create Book (CS11)
  // ==========================================

  async createBook(dto: CreateBookDto, _adminId?: string): Promise<BookDocument> {
    if (!dto.title?.trim()) {
      throw new BadRequestException({ code: 'TITLE_REQUIRED', message: 'Book title is required' });
    }

    const slug = dto.slug?.trim() ? slugify(dto.slug) : slugify(dto.title);
    if (!slug) {
      throw new BadRequestException({ code: 'INVALID_SLUG', message: 'Valid slug is required' });
    }

    const conflict = await this.bookModel.findOne({ slug }).exec();
    if (conflict) {
      throw new ConflictException({
        code: 'BOOK_EXISTS',
        message: 'A book with this slug already exists',
      });
    }

    const status = dto.status || 'draft';
    const publishedAt =
      status === 'published'
        ? dto.publishedAt
          ? new Date(dto.publishedAt)
          : new Date()
        : dto.publishedAt
          ? new Date(dto.publishedAt)
          : undefined;

    const book = new this.bookModel({
      title: dto.title.trim(),
      slug,
      author: dto.author?.trim() || '',
      coverUrl: dto.coverUrl?.trim() || '',
      descriptionHtml: dto.descriptionHtml || '',
      descriptionJson: dto.descriptionJson,
      format: dto.format,
      fileUrl: dto.fileUrl?.trim() || undefined,
      summaryJson: dto.summaryJson,
      categoryId:
        dto.categoryId && Types.ObjectId.isValid(dto.categoryId)
          ? new Types.ObjectId(dto.categoryId)
          : undefined,
      tags: dto.tags || [],
      isFree: dto.isFree ?? true,
      priceInr: dto.priceInr !== undefined ? Math.max(0, dto.priceInr) : undefined,
      status,
      publishedAt,
    });

    return book.save();
  }

  // ==========================================
  // Update Book (CS11)
  // ==========================================

  async updateBook(id: string, dto: UpdateBookDto, _adminId?: string): Promise<BookDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'BOOK_NOT_FOUND', message: 'Invalid book ID' });
    }

    const book = await this.bookModel.findById(id).exec();
    if (!book) {
      throw new NotFoundException({ code: 'BOOK_NOT_FOUND', message: 'Book not found' });
    }

    if (dto.slug) {
      const formattedSlug = slugify(dto.slug);
      const conflict = await this.bookModel
        .findOne({ slug: formattedSlug, _id: { $ne: book._id } })
        .exec();
      if (conflict) {
        throw new ConflictException({
          code: 'BOOK_EXISTS',
          message: 'Another book with this slug already exists',
        });
      }
      book.slug = formattedSlug;
    }

    if (dto.title !== undefined) book.title = dto.title.trim();
    if (dto.author !== undefined) book.author = dto.author.trim();
    if (dto.coverUrl !== undefined) book.coverUrl = dto.coverUrl.trim();
    if (dto.descriptionHtml !== undefined) book.descriptionHtml = dto.descriptionHtml;
    if (dto.descriptionJson !== undefined) book.descriptionJson = dto.descriptionJson;
    if (dto.format !== undefined) book.format = dto.format as BookFormat;
    if (dto.fileUrl !== undefined) book.fileUrl = dto.fileUrl.trim();
    if (dto.summaryJson !== undefined) book.summaryJson = dto.summaryJson;

    if (dto.categoryId !== undefined) {
      book.categoryId =
        dto.categoryId && Types.ObjectId.isValid(dto.categoryId)
          ? new Types.ObjectId(dto.categoryId)
          : undefined;
    }

    if (dto.tags !== undefined) book.tags = dto.tags;
    if (dto.isFree !== undefined) book.isFree = dto.isFree;
    if (dto.priceInr !== undefined) book.priceInr = Math.max(0, dto.priceInr);

    if (dto.status !== undefined) {
      if (dto.status === 'published' && book.status !== 'published' && !book.publishedAt) {
        book.publishedAt = new Date();
      }
      book.status = dto.status;
    }

    if (dto.publishedAt !== undefined) {
      book.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : undefined;
    }

    return book.save();
  }

  // ==========================================
  // Delete Book
  // ==========================================

  async deleteBook(id: string, _adminId?: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'BOOK_NOT_FOUND', message: 'Invalid book ID' });
    }

    const book = await this.bookModel.findById(id).exec();
    if (!book) {
      throw new NotFoundException({ code: 'BOOK_NOT_FOUND', message: 'Book not found' });
    }

    await this.bookModel.findByIdAndDelete(id).exec();
    return { success: true, message: 'Book deleted successfully' };
  }

  // ==========================================
  // Publish / Unpublish
  // ==========================================

  async publishBook(id: string, _adminId?: string): Promise<BookDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'BOOK_NOT_FOUND', message: 'Invalid book ID' });
    }

    const book = await this.bookModel.findById(id).exec();
    if (!book) {
      throw new NotFoundException({ code: 'BOOK_NOT_FOUND', message: 'Book not found' });
    }

    book.status = 'published';
    if (!book.publishedAt) {
      book.publishedAt = new Date();
    }
    return book.save();
  }

  async unpublishBook(id: string, _adminId?: string): Promise<BookDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({ code: 'BOOK_NOT_FOUND', message: 'Invalid book ID' });
    }

    const book = await this.bookModel.findById(id).exec();
    if (!book) {
      throw new NotFoundException({ code: 'BOOK_NOT_FOUND', message: 'Book not found' });
    }

    book.status = 'draft';
    return book.save();
  }

  // ==========================================
  // Bulk Actions
  // ==========================================

  async bulkAction(
    ids: string[],
    action: 'archive' | 'delete',
  ): Promise<{ success: boolean; modifiedCount: number }> {
    const validIds = (ids || [])
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (validIds.length === 0) {
      return { success: true, modifiedCount: 0 };
    }

    if (action === 'delete') {
      const res = await this.bookModel.deleteMany({ _id: { $in: validIds } }).exec();
      return { success: true, modifiedCount: res.deletedCount || 0 };
    }

    const res = await this.bookModel
      .updateMany({ _id: { $in: validIds } }, { $set: { status: 'archived' } })
      .exec();

    return { success: true, modifiedCount: res.modifiedCount || 0 };
  }
}
