import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ERROR_CODES,
  QUIZ_KINDS,
  QUIZ_STATUSES,
  type QuizKind,
  type CreateAdminQuizDto,
  type UpdateAdminQuizDto,
  type CsvQuizImportRow,
  type CsvImportDryRunResponse,
} from '@sofe/shared';
import { Quiz, QuizDocument } from '../../database/schemas/quiz.schema';

export interface AdminQuizListQuery {
  page?: number | string;
  limit?: number | string;
  kind?: QuizKind;
  status?: string;
  search?: string;
}

@Injectable()
export class AdminQuizzesService {
  constructor(
    @InjectModel(Quiz.name)
    private readonly quizModel: Model<QuizDocument>,
  ) {}

  async listQuizzes(query: AdminQuizListQuery) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (query.kind) {
      filter.kind = query.kind;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.search?.trim()) {
      filter.title = { $regex: query.search.trim(), $options: 'i' };
    }

    const [items, total] = await Promise.all([
      this.quizModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.quizModel.countDocuments(filter),
    ]);

    return {
      items: items.map((q) => ({
        id: q._id.toString(),
        title: q.title,
        kind: q.kind,
        passingScorePercent: q.passingScorePercent,
        questionCount: q.questions?.length || 0,
        status: q.status,
        order: q.order,
        createdAt: q.createdAt ? q.createdAt.toISOString() : undefined,
        updatedAt: q.updatedAt ? q.updatedAt.toISOString() : undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getQuizById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Quiz not found',
      });
    }

    const quiz = await this.quizModel.findById(id).lean();
    if (!quiz) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Quiz not found',
      });
    }

    return {
      id: quiz._id.toString(),
      title: quiz.title,
      kind: quiz.kind,
      lessonId: quiz.lessonId?.toString(),
      topicId: quiz.topicId?.toString(),
      passingScorePercent: quiz.passingScorePercent,
      questions: quiz.questions || [],
      status: quiz.status,
      order: quiz.order,
      createdAt: quiz.createdAt ? quiz.createdAt.toISOString() : undefined,
      updatedAt: quiz.updatedAt ? quiz.updatedAt.toISOString() : undefined,
    };
  }

  async createQuiz(dto: CreateAdminQuizDto) {
    if (dto.status === QUIZ_STATUSES.PUBLISHED && (dto.questions?.length || 0) < 3) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Publishing requires at least 3 questions in the quiz',
      });
    }

    const questionsWithIds = (dto.questions || []).map((q, qIndex) => ({
      ...q,
      id: q.id || `q_${Date.now()}_${qIndex}`,
      options: q.options.map((opt, optIndex) => ({
        ...opt,
        id: opt.id || `opt_${qIndex}_${optIndex}`,
      })),
    }));

    const quiz = await this.quizModel.create({
      ...dto,
      questions: questionsWithIds,
      lessonId: dto.lessonId ? new Types.ObjectId(dto.lessonId) : undefined,
      topicId: dto.topicId ? new Types.ObjectId(dto.topicId) : undefined,
    });

    return this.getQuizById(quiz._id.toString());
  }

  async updateQuiz(id: string, dto: UpdateAdminQuizDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Quiz not found',
      });
    }

    const existing = await this.quizModel.findById(id);
    if (!existing) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Quiz not found',
      });
    }

    const targetStatus = dto.status !== undefined ? dto.status : existing.status;
    const targetQuestions = dto.questions !== undefined ? dto.questions : existing.questions;

    if (targetStatus === QUIZ_STATUSES.PUBLISHED && targetQuestions.length < 3) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Publishing requires at least 3 questions in the quiz',
      });
    }

    if (dto.title !== undefined) existing.title = dto.title;
    if (dto.kind !== undefined) existing.kind = dto.kind;
    if (dto.passingScorePercent !== undefined)
      existing.passingScorePercent = dto.passingScorePercent;
    if (dto.status !== undefined) existing.status = dto.status;
    if (dto.order !== undefined) existing.order = dto.order;
    if (dto.lessonId !== undefined) {
      existing.lessonId = dto.lessonId ? new Types.ObjectId(dto.lessonId) : undefined;
    }
    if (dto.topicId !== undefined) {
      existing.topicId = dto.topicId ? new Types.ObjectId(dto.topicId) : undefined;
    }
    if (dto.questions !== undefined) {
      existing.questions = dto.questions.map((q, qIndex) => ({
        ...q,
        id: q.id || `q_${Date.now()}_${qIndex}`,
        options: q.options.map((opt, optIndex) => ({
          ...opt,
          id: opt.id || `opt_${qIndex}_${optIndex}`,
        })),
      })) as unknown as typeof existing.questions;
    }

    await existing.save();
    return this.getQuizById(id);
  }

  async deleteQuiz(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Quiz not found',
      });
    }

    const res = await this.quizModel.deleteOne({ _id: new Types.ObjectId(id) });
    if (res.deletedCount === 0) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: 'Quiz not found',
      });
    }

    return { success: true };
  }

  previewCsvImport(rows: CsvQuizImportRow[]): CsvImportDryRunResponse {
    if (!Array.isArray(rows)) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Rows array required',
      });
    }

    if (rows.length > 500) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Maximum 500 rows allowed per import',
      });
    }

    const errors: Array<{ row: number; field: string; message: string }> = [];
    const validRows: CsvQuizImportRow[] = [];
    const quizTitlesSet = new Set<string>();

    rows.forEach((row, index) => {
      const rowNum = index + 1;
      let hasError = false;

      if (!row.quiz_title?.trim()) {
        errors.push({ row: rowNum, field: 'quiz_title', message: 'Quiz title is required' });
        hasError = true;
      }
      if (!row.question?.trim()) {
        errors.push({ row: rowNum, field: 'question', message: 'Question prompt is required' });
        hasError = true;
      }
      if (!row.type || !['single', 'multi', 'true_false'].includes(row.type)) {
        errors.push({
          row: rowNum,
          field: 'type',
          message: 'Type must be single, multi, or true_false',
        });
        hasError = true;
      }
      if (!row.option_a?.trim() || !row.option_b?.trim()) {
        errors.push({
          row: rowNum,
          field: 'options',
          message: 'At least option_a and option_b are required',
        });
        hasError = true;
      }
      if (!row.correct?.trim()) {
        errors.push({ row: rowNum, field: 'correct', message: 'Correct answer(s) required' });
        hasError = true;
      }
      if (!row.explanation?.trim()) {
        errors.push({ row: rowNum, field: 'explanation', message: 'Explanation is required' });
        hasError = true;
      }

      if (!hasError) {
        validRows.push(row);
        quizTitlesSet.add(row.quiz_title.trim());
      }
    });

    const preview = validRows.slice(0, 10).map((r) => {
      const options = [
        r.option_a,
        r.option_b,
        r.option_c,
        r.option_d,
        r.option_e,
        r.option_f,
      ].filter(Boolean);
      const correctParts = r.correct
        .split(/[,|]/)
        .map((p) => p.trim())
        .filter(Boolean);
      return {
        quizTitle: r.quiz_title,
        questionText: r.question,
        type: r.type,
        optionsCount: options.length,
        correctCount: correctParts.length,
      };
    });

    return {
      totalRows: rows.length,
      validRows: validRows.length,
      errorRows: errors.length > 0 ? rows.length - validRows.length : 0,
      quizzesDetected: quizTitlesSet.size,
      errors,
      preview,
    };
  }

  async executeCsvImport(rows: CsvQuizImportRow[]) {
    const dryRun = this.previewCsvImport(rows);
    if (dryRun.errors.length > 0) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: `Import contains ${dryRun.errors.length} validation errors`,
        errors: dryRun.errors,
      });
    }

    // Group rows by quiz_title
    const groups = new Map<string, CsvQuizImportRow[]>();
    for (const row of rows) {
      const title = row.quiz_title.trim();
      if (!groups.has(title)) {
        groups.set(title, []);
      }
      groups.get(title)!.push(row);
    }

    const createdQuizzes = [];

    for (const [title, quizRows] of groups.entries()) {
      const questions = quizRows.map((r, qIdx) => {
        const optionKeys = ['A', 'B', 'C', 'D', 'E', 'F'] as const;
        const rawOptions = [r.option_a, r.option_b, r.option_c, r.option_d, r.option_e, r.option_f];
        const correctKeys = r.correct
          .toUpperCase()
          .split(/[,|]/)
          .map((k) => k.trim());

        const options = rawOptions
          .map((text, idx) => {
            if (!text || !text.trim()) return null;
            const key = optionKeys[idx];
            const isCorrect = correctKeys.includes(key);
            return {
              id: `opt_${qIdx}_${key.toLowerCase()}`,
              text: text.trim(),
              isCorrect,
              explanation: isCorrect ? r.explanation : undefined,
            };
          })
          .filter(Boolean);

        return {
          id: `q_${qIdx}_${Date.now()}`,
          text: r.question.trim(),
          type: r.type,
          options,
          points: 10,
        };
      });

      const quiz = await this.quizModel.create({
        title,
        kind: QUIZ_KINDS.QUICK_QUIZ,
        passingScorePercent: 80,
        status: questions.length >= 3 ? QUIZ_STATUSES.PUBLISHED : QUIZ_STATUSES.DRAFT,
        questions,
      });

      createdQuizzes.push(quiz);
    }

    return {
      success: true,
      quizzesCreated: createdQuizzes.length,
      totalQuestions: rows.length,
    };
  }
}
