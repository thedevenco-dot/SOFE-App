import { z } from 'zod';
import { dateKeySchema } from './common';

export const quizAnswerSubmissionSchema = z.object({
  questionId: z.string().min(1),
  selectedOptionIds: z.array(z.string().min(1)).min(1),
});

export const submitQuizAttemptSchema = z.object({
  answers: z.array(quizAnswerSubmissionSchema),
});

export const createReflectionSchema = z.object({
  text: z.string().min(1).max(2000),
  promptId: z.string().optional(),
});

export const dateRangeQuerySchema = z.object({
  from: dateKeySchema.optional(),
  to: dateKeySchema.optional(),
});
