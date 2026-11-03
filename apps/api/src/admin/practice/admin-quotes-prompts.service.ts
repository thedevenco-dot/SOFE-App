import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ERROR_CODES,
  type CreateReflectionPromptDto,
  type UpdateReflectionPromptDto,
} from '@sofe/shared';
import {
  Quote,
  QuoteDocument,
  Word,
  WordDocument,
  ReflectionPrompt,
  ReflectionPromptDocument,
} from '../../database/schemas';

@Injectable()
export class AdminQuotesPromptsService {
  constructor(
    @InjectModel(Quote.name)
    private readonly quoteModel: Model<QuoteDocument>,
    @InjectModel(Word.name)
    private readonly wordModel: Model<WordDocument>,
    @InjectModel(ReflectionPrompt.name)
    private readonly promptModel: Model<ReflectionPromptDocument>,
  ) {}

  // ==========================================
  // Quotes (CS26 Tab 1)
  // ==========================================

  async listQuotes(status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const items = await this.quoteModel.find(filter).sort({ createdAt: -1 }).lean();
    return items.map((q) => ({
      id: q._id.toString(),
      text: q.text,
      author: q.author,
      tags: q.tags || [],
      status: q.status,
      createdAt: q.createdAt?.toISOString(),
      updatedAt: q.updatedAt?.toISOString(),
    }));
  }

  async createQuote(dto: {
    text: string;
    author?: string;
    tags?: string[];
    status?: 'draft' | 'published' | 'archived';
  }) {
    const item = await this.quoteModel.create({
      text: dto.text,
      author: dto.author,
      tags: dto.tags || [],
      status: dto.status || 'published',
    });
    return {
      id: item._id.toString(),
      text: item.text,
      author: item.author,
      tags: item.tags,
      status: item.status,
      createdAt: item.createdAt?.toISOString(),
    };
  }

  async updateQuote(
    id: string,
    dto: Partial<{
      text: string;
      author: string;
      tags: string[];
      status: 'draft' | 'published' | 'archived';
    }>,
  ) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException({ code: ERROR_CODES.NOT_FOUND, message: 'Quote not found' });
    const item = await this.quoteModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    if (!item)
      throw new NotFoundException({ code: ERROR_CODES.NOT_FOUND, message: 'Quote not found' });
    return {
      id: item._id.toString(),
      text: item.text,
      author: item.author,
      tags: item.tags,
      status: item.status,
      updatedAt: item.updatedAt?.toISOString(),
    };
  }

  async deleteQuote(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException({ code: ERROR_CODES.NOT_FOUND, message: 'Quote not found' });
    const res = await this.quoteModel.deleteOne({ _id: new Types.ObjectId(id) });
    if (res.deletedCount === 0)
      throw new NotFoundException({ code: ERROR_CODES.NOT_FOUND, message: 'Quote not found' });
    return { success: true };
  }

  // ==========================================
  // Words of the Day (CS26 Tab 2)
  // ==========================================

  async listWords(status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    const items = await this.wordModel.find(filter).sort({ createdAt: -1 }).lean();
    return items.map((w) => ({
      id: w._id.toString(),
      word: w.word,
      meaning: w.meaning,
      status: w.status,
      createdAt: w.createdAt?.toISOString(),
      updatedAt: w.updatedAt?.toISOString(),
    }));
  }

  async createWord(dto: {
    word: string;
    meaning?: string;
    status?: 'draft' | 'published' | 'archived';
  }) {
    const item = await this.wordModel.create({
      word: dto.word.toUpperCase().trim(),
      meaning: dto.meaning,
      status: dto.status || 'published',
    });
    return {
      id: item._id.toString(),
      word: item.word,
      meaning: item.meaning,
      status: item.status,
      createdAt: item.createdAt?.toISOString(),
    };
  }

  async updateWord(
    id: string,
    dto: Partial<{ word: string; meaning: string; status: 'draft' | 'published' | 'archived' }>,
  ) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException({ code: ERROR_CODES.NOT_FOUND, message: 'Word not found' });
    const updateData = { ...dto };
    if (dto.word) updateData.word = dto.word.toUpperCase().trim();
    const item = await this.wordModel.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!item)
      throw new NotFoundException({ code: ERROR_CODES.NOT_FOUND, message: 'Word not found' });
    return {
      id: item._id.toString(),
      word: item.word,
      meaning: item.meaning,
      status: item.status,
      updatedAt: item.updatedAt?.toISOString(),
    };
  }

  async deleteWord(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException({ code: ERROR_CODES.NOT_FOUND, message: 'Word not found' });
    const res = await this.wordModel.deleteOne({ _id: new Types.ObjectId(id) });
    if (res.deletedCount === 0)
      throw new NotFoundException({ code: ERROR_CODES.NOT_FOUND, message: 'Word not found' });
    return { success: true };
  }

  // ==========================================
  // Reflection Prompts (CS26 Tab 3)
  // ==========================================

  async listPrompts(activeOnly = false) {
    const filter: Record<string, unknown> = {};
    if (activeOnly) filter.active = true;
    const items = await this.promptModel.find(filter).sort({ order: 1, createdAt: -1 }).lean();
    return items.map((p) => ({
      id: p._id.toString(),
      prompt: p.prompt,
      category: p.category,
      active: p.active,
      order: p.order,
      createdAt: p.createdAt?.toISOString(),
      updatedAt: p.updatedAt?.toISOString(),
    }));
  }

  async createPrompt(dto: CreateReflectionPromptDto) {
    const item = await this.promptModel.create(dto);
    return {
      id: item._id.toString(),
      prompt: item.prompt,
      category: item.category,
      active: item.active,
      order: item.order,
      createdAt: item.createdAt?.toISOString(),
    };
  }

  async updatePrompt(id: string, dto: UpdateReflectionPromptDto) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException({ code: ERROR_CODES.NOT_FOUND, message: 'Prompt not found' });
    const item = await this.promptModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
    if (!item)
      throw new NotFoundException({ code: ERROR_CODES.NOT_FOUND, message: 'Prompt not found' });
    return {
      id: item._id.toString(),
      prompt: item.prompt,
      category: item.category,
      active: item.active,
      order: item.order,
      updatedAt: item.updatedAt?.toISOString(),
    };
  }

  async deletePrompt(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException({ code: ERROR_CODES.NOT_FOUND, message: 'Prompt not found' });
    const res = await this.promptModel.deleteOne({ _id: new Types.ObjectId(id) });
    if (res.deletedCount === 0)
      throw new NotFoundException({ code: ERROR_CODES.NOT_FOUND, message: 'Prompt not found' });
    return { success: true };
  }
}
