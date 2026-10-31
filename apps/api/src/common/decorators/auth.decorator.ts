import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { LearnerAuthGuard } from '../guards/learner-auth.guard';

export const IS_AUTH_KEY = 'isLearnerAuth';

export function Auth() {
  return applyDecorators(
    SetMetadata(IS_AUTH_KEY, true),
    UseGuards(LearnerAuthGuard),
    ApiBearerAuth('firebase-auth'),
  );
}
