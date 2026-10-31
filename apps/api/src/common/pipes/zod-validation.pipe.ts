import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { ERROR_CODES } from '@sofe/shared';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema?: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    // Only validate request body, query, or params; never custom injected decorators
    if (metadata.type === 'custom') {
      return value;
    }

    const targetSchema = this.schema;
    if (!targetSchema) {
      return value;
    }

    const result = targetSchema.safeParse(value);
    if (!result.success) {
      const error = result.error as ZodError;
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_FAILED,
        message: 'Request validation failed',
        details: error.format(),
      });
    }

    return result.data;
  }
}
